import ShortRestDialog from "./shortRestDialog.js";

export default async function newShortRest() {
	await ShortRestDialog.shortRestDialog({ actor: this }, _rest.bind(this));
}

/**
 * Perform all of the changes needed for a short or long rest.
 *
 * @param {boolean} newDay         Has a new day occurred during this rest?
 * @param {boolean} longRest       Is this a long rest?
 * @param {number} [dhd=0]         Number of hit dice spent during so far during the rest.
 * @param {number} [dhp=0]         Number of hit points recovered so far during the rest.
 * @returns {Promise<RestResult>}  Consolidated results of the rest workflow.
 * @private
 */
async function _rest(newDay, longRest, dhd = 0, dhp = 0) {
	let hitPointsRecovered = 0;
	let hitPointUpdates = {};
	let hitDiceRecovered = 0;
	let hitDiceUpdates = [];

	// Recover hit points & hit dice on long rest
	if (longRest) {
		({ updates: hitPointUpdates, hitPointsRecovered } = this._getRestHitPointRecovery());
		({ updates: hitDiceUpdates, hitDiceRecovered } = this._getRestHitDiceRecovery());
	}

	// Figure out the rest of the changes
	const result = {
		dhd: dhd + hitDiceRecovered,
		dhp: dhp + hitPointsRecovered,
		updateData: {
			...hitPointUpdates,
			...this._getRestResourceRecovery({ recoverShortRestResources: !longRest, recoverLongRestResources: longRest }),
			...this._getRestSpellRecovery({ recoverSpells: longRest })
		},
		updateItems: [...hitDiceUpdates, ...this._getRestItemUsesRecovery({ recoverLongRestUses: longRest, recoverDailyUses: newDay })],
		longRest,
		newDay
	};

	// Perform updates
	await this.update(result.updateData);
	await this.updateEmbeddedDocuments("Item", result.updateItems);

	// Display a Chat Message summarizing the rest effects
	await this._displayRestResultMessage(result, longRest);

	// Call restCompleted hook so that modules can easily perform actions when actors finish a rest
	Hooks.callAll("restCompleted", this, result);

	// Return data summarizing the rest effects
	return result;
}

async function rest({ totalHitDiceSpent, totalHeal }) {
	// Display a Chat Message summarizing the rest effects
	const restFlavor = game.i18n.localize("DND5E.ShortRestNormal");

	// Recover character resources
	const updateData = {};
	for (let [k, r] of Object.entries(this.data.data.resources)) {
		if (r.max && r.sr) {
			updateData[`data.resources.${k}.value`] = r.max;
		}
	}

	// Recover pact slots.
	const pact = this.data.data.spells.pact;
	updateData["data.spells.pact.value"] = pact.override || pact.max;
	await this.update(updateData);

	// Recover item uses
	const items = this.items.filter((item) => item.data.data.uses && item.data.data.uses.per === "sr");
	const updateItems = items.map((item) => {
		return {
			_id: item._id,
			"data.uses.value": item.data.data.uses.max
		};
	});
	await this.updateEmbeddedEntity("OwnedItem", updateItems);

	// Summarize the health effects
	let srMessage = "DND5E.ShortRestResultShort";
	if (totalHitDiceSpent !== 0 && totalHeal !== 0) srMessage = "DND5E.ShortRestResult";

	// Create a chat message
	ChatMessage.create({
		user: game.user._id,
		speaker: { actor: this, alias: this.name },
		flavor: restFlavor,
		content: game.i18n.format(srMessage, { name: this.name, dice: totalHitDiceSpent, health: totalHeal })
	});

	// Return data summarizing the rest effects
	return {
		dhd: totalHitDiceSpent,
		dhp: totalHeal,
		updateData: updateData,
		updateItems: updateItems,
		newDay: false
	};
}
