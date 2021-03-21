import ShortRestDialog from "./shortRestDialog.js";

export default async function newShortRest() {
	await ShortRestDialog.shortRestDialog({ actor: this }, rest.bind(this));
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

	console.warn(totalHitDiceSpent, totalHeal);
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
