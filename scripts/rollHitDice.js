export default async function rollHitDice(actor, denomination, amount) {
	const classes = actor.data.items.filter((item) => {
		if (item.type === "class") {
			const d = item.data;
			const denom = d.hitDice || "d6";
			return denom === denomination;
		}
	});

	// If no class is available, display an error notification
	if (classes.length === 0) {
		ui.notifications.error(game.i18n.format("DND5E.HitDiceWarn", { name: actor.data.data.name, formula: denomination }));
		return null;
	}

	// Prepare roll data
	const hitDiceFormula = `${amount}${denomination} + @abilities.con.mod * ${amount}`;

	const roll = new Roll(hitDiceFormula, actor.data.data);
	roll.roll();
	await roll.toMessage({
        flavor: game.i18n.localize("DND5E.HitDiceRoll")
    });

	// Adjust actor data
	// await cls.update({ "data.hitDiceUsed": cls.data.data.hitDiceUsed + 1 });
	let spentHitDice = amount;
	for (const cls of classes) {
		const d = cls.data;
		const total = parseInt(d.levels || 1);
		const used = parseInt(d.hitDiceUsed || 0);
		const available = total - used;
		const hitDiceToSpend = Math.min(available, spentHitDice);
		await updateClass(actor, cls, hitDiceToSpend);
		spentHitDice -= hitDiceToSpend;
		if (spentHitDice <= 0) {
			break;
		}
	}

	const hp = actor.data.data.attributes.hp;
	const dhp = Math.min(hp.max + (hp.tempmax ?? 0) - hp.value, roll.total);
	await actor.update({ "data.attributes.hp.value": hp.value + dhp });
	return roll;
}

const updateClass = async (actor, cls, hitDiceToSpend) => {
	const realClass = actor.getOwnedItem(cls._id);
	const used = realClass.data.data.hitDiceUsed;
	await realClass.update({ "data.hitDiceUsed": used + hitDiceToSpend });
};
