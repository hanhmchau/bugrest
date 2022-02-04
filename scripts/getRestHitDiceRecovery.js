export default function getRestHitDiceRecovery({ maxHitDice = undefined } = {}) {
	// Determine the number of hit dice which may be recovered
	if (maxHitDice === undefined) {
		maxHitDice = Math.max(Math.floor(this.data.data.details.level), 1);
	}

	// Sort classes which can recover HD, assuming players prefer recovering larger HD first.
	const sortedClasses = Object.values(this.classes).sort((a, b) => {
		return (parseInt(b.data.data.hitDice.slice(1)) || 0) - (parseInt(a.data.data.hitDice.slice(1)) || 0);
	});

	let updates = [];
	let hitDiceRecovered = 0;
	for (let item of sortedClasses) {
		const d = item.data.data;
		if (hitDiceRecovered < maxHitDice && d.hitDiceUsed > 0) {
			let delta = Math.min(d.hitDiceUsed || 0, maxHitDice - hitDiceRecovered);
			hitDiceRecovered += delta;
			updates.push({ _id: item.id, "data.hitDiceUsed": d.hitDiceUsed - delta });
		}
	}

	return { updates, hitDiceRecovered };
}
