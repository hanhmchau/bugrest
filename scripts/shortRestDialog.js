import rollHitDice from "./rollHitDice.js";

/**
 * A helper Dialog subclass for rolling Hit Dice on short rest
 * @extends {Dialog}
 */
export default class ShortRestDialog extends Dialog {
	constructor(actor, dialogData = {}, options = {}) {
		super(dialogData, options);

		/**
		 * Store a reference to the Actor entity which is resting
		 * @type {Actor}
		 */
		this.actor = actor;

		/**
		 * Track the most recently used HD denomination for re-rendering the form
		 * @type {string}
		 */
		this._denom = null;

		this.dialogData = dialogData;
	}

	/** @override */
	activateListeners(html) {
		html.find("#rest").click(this._onRest.bind(this));
		if (this.data.render instanceof Function) this.data.render(this.options.jQuery ? html : html[0]);
	}

	/* -------------------------------------------- */

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			template: "modules/bugrest/templates/short-rest.html",
			classes: ["dnd5e", "dialog"]
		});
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		const data = super.getData();

		// Determine Hit Dice
		const hitDiceMap = this._getHitDiceMap();
		data.availableHD = this._getAvailableHitDiceObject(hitDiceMap);
		data.denomination = this._denom;
		return data;
	}

	async _onRest(event) {
		const $form = $(event.target).closest("#short-rest-hd");
		const map = new Map();
		$form.find(".hit-dice-selector").each((i, el) => {
			const val = $(el).val();
			const denom = $(el).data("denom");
			map.set(denom, parseInt(val));
		});
		let totalHeal = 0;
		let totalHitDiceSpent = 0;
		for (const [denom, val] of map.entries()) {
			if (val > 0) {
				const roll = await rollHitDice(this.actor, denom, val);
				totalHitDiceSpent += val;
				totalHeal += roll.total;
			}
		}
		await this.dialogData.callback(false, false, -totalHitDiceSpent, totalHeal);
		this.render();
	}

	_getAvailableHitDiceObject(hitDiceMap) {
		const sortedMap = new Map([...hitDiceMap].sort((a, b) => b[1].total - a[1].total));
		const obj = {};
		sortedMap.forEach((value, key) => {
			obj[key] = value;
		});
		return obj;
	}

	_getHitDiceMap() {
		const map = new Map();
		const classes = this.actor.data.data.classes;
		console.warn(this.actor.data.data.classes);
		for (const className in classes) {
			const cls = classes[className];
			const denom = cls.hitDice || "d6";
			const total = parseInt(cls.levels || 1);
			const available = total - parseInt(cls.hitDiceUsed || 0);
			const value = map.get(denom) || { total: 0, available: 0 };
			map.set(denom, {
				total: value.total + total,
				available: value.available + available
			});
		}
		return map;
	}

	/* -------------------------------------------- */

	/**
	 * A helper constructor function which displays the Short Rest dialog and returns a Promise once it's workflow has
	 * been resolved.
	 * @param {Actor5e} actor
	 * @return {Promise}
	 */
	static async shortRestDialog({ actor } = {}, callback = () => {}) {
		return new Promise((resolve, reject) => {
			const dlg = new this(actor, {
				title: "Short Rest",
				buttons: [],
				close: reject,
				resolve,
				callback
			});
			dlg.render(true);
		});
	}
}
