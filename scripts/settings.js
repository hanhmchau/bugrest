export const ModuleOptions = {
    BIG_REST: 'bigrest'
};

export class ModuleSettings {
    static MODULE_NAME = 'bugrest';

	static registerSettings() {
        game.settings.register(this.MODULE_NAME, ModuleOptions.BIG_REST, this._buildConfig(ModuleOptions.BIG_REST, {
            default: true,
            scope: "world"
        }));
	}

	static getSetting(option) {
		return game.settings.get(this.MODULE_NAME, option);
    }

    /** @private */
    static _getNameConfig(optionName) {
        return {
            name: `${this.MODULE_NAME}.${optionName}-s`,
            hint: `${this.MODULE_NAME}.${optionName}-l`
        };
    }
    
    /** @private */
    static _buildConfig(optionName, config = {}) {
        const defaultConfig = {
            scope: "client",
            config: true,
            default: false,
            type: Boolean,
            onChange: x => window.location.reload()
        };
        return {
            ...defaultConfig,
            ...this._getNameConfig(optionName),
            ...config
        };
    }
}