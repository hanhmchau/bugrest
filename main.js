"use strict";

import { libWrapper } from "./lib/libwrapper.js";
import shortRest from "./scripts/shortRest.js";
import getRestHitDiceRecovery from "./scripts/getRestHitDiceRecovery.js";
import { ModuleSettings, ModuleOptions } from "./scripts/settings.js";

Hooks.on("setup", () => {
	ModuleSettings.registerSettings();

	libWrapper.register("bugrest", "CONFIG.Actor.entityClass.prototype.shortRest", shortRest, "OVERRIDE");

	if (ModuleSettings.getSetting(ModuleOptions.BIG_REST)) {
		libWrapper.register("bugrest", "CONFIG.Actor.entityClass.prototype._getRestHitDiceRecovery", getRestHitDiceRecovery, "OVERRIDE");
	}

	Handlebars.registerHelper("timesInclusive", function (n, block) {
		var accum = "";
		for (var i = 0; i <= n; ++i) accum += block.fn(i);
		return accum;
	});

	Handlebars.registerHelper("when", function (operand_1, operator, operand_2, options) {
		var operators = {
				eq: function (l, r) {
					return l == r;
				},
				noteq: function (l, r) {
					return l != r;
				},
				gt: function (l, r) {
					return Number(l) > Number(r);
				},
				or: function (l, r) {
					return l || r;
				},
				and: function (l, r) {
					return l && r;
				},
				"%": function (l, r) {
					return l % r === 0;
				}
			},
			result = operators[operator](operand_1, operand_2);

		if (result) return options.fn(this);
		else return options.inverse(this);
	});
});
