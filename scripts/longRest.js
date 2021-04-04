export default async function longRest(next, options) {
	const hitDicesToRestore = getHitDiceUpdates.call(this);
	const restResult = await next({
		...options,
		chat: false
	});
	if (restResult) {
		await restoreAllHitDice.call(this, hitDicesToRestore.updateItems);
		sendMessage.call(this, restResult.dhp, hitDicesToRestore.hitDiceUsed);
	}
}

async function restoreAllHitDice(updateItems) {
	// Perform the updates
	if (updateItems.length) await this.updateEmbeddedEntity("OwnedItem", updateItems);
}

function getHitDiceUpdates() {
	const classes = this.items.filter((item) => item.data.type === "class");
	const updateItems = classes.map((item) => ({ _id: item.id, "data.hitDiceUsed": 0 }));
	const hitDiceUsed = classes.reduce((accumulated, curr) => accumulated + curr.data.data.hitDiceUsed, 0);
	return {
		updateItems,
		hitDiceUsed
	};
}

function sendMessage(dhp, dhd) {
	let lrMessage = "DND5E.LongRestResultShort";
	if (dhp !== 0 && dhd !== 0) lrMessage = "DND5E.LongRestResult";
	else if (dhp !== 0 && dhd === 0) lrMessage = "DND5E.LongRestResultHitPoints";
	else if (dhp === 0 && dhd !== 0) lrMessage = "DND5E.LongRestResultHitDice";
	ChatMessage.create({
		user: game.user._id,
		speaker: { actor: this, alias: this.name },
		content: game.i18n.format(lrMessage, { name: this.name, health: dhp, dice: dhd })
	});
}
