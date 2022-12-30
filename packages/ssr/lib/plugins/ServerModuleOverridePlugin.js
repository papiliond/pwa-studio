/**
 * @description webpack plugin that runs on "node" targeted builds and resolves
 * any "*.js" module as "*.server.js" if that file exists.
 */
class ServerModuleOverridePlugin {
    constructor() {
        this.name = 'ServerModuleOverridePlugin';
    }
    requireResolveIfCan(id, compiler, options = undefined) {
        // Replace aliases with existing paths
        const { alias = {} } = compiler.options.resolve;
        const aliasKey = Object.keys(alias).find(key => id.startsWith(key));
        if (aliasKey) {
            id = id.replace(aliasKey, alias[aliasKey]);
        }

        try {
            return require.resolve(id, options);
        } catch (e) {
            return undefined;
        }
    }
    apply(compiler) {
        compiler.hooks.normalModuleFactory.tap(this.name, nmf => {
            nmf.hooks.beforeResolve.tap(this.name, resolve => {
                if (!resolve || compiler.options.target !== 'node') {
                    return;
                }

                const moduleToReplace = this.requireResolveIfCan(
                    resolve.request,
                    compiler,
                    {
                        paths: [resolve.context]
                    }
                );

                let modifiedRequest = '';
                const hasExtension = /\.js$/.test(resolve.request);
                if (hasExtension) {
                    modifiedRequest = resolve.request.replace(
                        /(\.js$)/,
                        '.server.js'
                    );
                } else {
                    modifiedRequest = resolve.request + '.server';
                }

                const moduleToReplaceWith = this.requireResolveIfCan(
                    modifiedRequest,
                    compiler,
                    {
                        paths: [resolve.context]
                    }
                );
                if (moduleToReplace && moduleToReplaceWith) {
                    resolve.request = moduleToReplaceWith;
                }

                return resolve;
            });
        });
    }
}

module.exports = ServerModuleOverridePlugin;
