export default async function rollHitDice(actor, denomination, amount) {
	// If no denomination was provided, choose the first available
	let cls = null;
	if (!denomination) {
		cls = actor.itemTypes.class.find((c) => c.data.data.hitDiceUsed < c.data.data.levels);
		if (!cls) return null;
		denomination = cls.data.data.hitDice;
	}

	// Otherwise locate a class (if any) which has an available hit die of the requested denomination
	else {
		cls = actor.items.find((i) => {
			const d = i.data.data;
			return d.hitDice === denomination && (d.hitDiceUsed || 0) < (d.levels || 1);
		});
	}

	// If no class is available, display an error notification
	if (!cls) {
		ui.notifications.error(game.i18n.format("DND5E.HitDiceWarn", { name: actor.name, formula: denomination }));
		return null;
	}

	// Prepare roll data
	const hitDiceFormula = `${amount}${denomination} + @abilities.con.mod * ${amount}`;
	const roll = new Roll(hitDiceFormula, actor.data.data);
	await roll.evaluate({ async: true });
	await roll.toMessage({
		flavor: `${game.i18n.localize("DND5E.HitDiceRoll")}: ${actor.name}`
	});

	// Adjust actor data
	await cls.update({ "data.hitDiceUsed": cls.data.data.hitDiceUsed + amount });
	const hp = actor.data.data.attributes.hp;
	const dhp = Math.min(hp.max + (hp.tempmax ?? 0) - hp.value, roll.total);
	await actor.update({ "data.attributes.hp.value": hp.value + dhp });
	return roll;
}
