
window.__modular = {
    modules: {},
    nameMap: {},

    init: function (scripts) {
        var modules = this.modules;
        var nameMap = this.nameMap;

        this.srcs = scripts.map(function (script) {
            var path = script.file;
            modules[path] = script;
            var name = path.substring(path.lastIndexOf('/')+1, path.length-3);

            if (!script.isNodeModule) {
                nameMap[name] = path;
            }
            return path;
        });

        var originPush = cc._RF.push;
        cc._RF.push = function (module, uuid, request, path) {
            modules[path].module = module;
            originPush(module, uuid, request);
        };

        cc.require = function (request, path) {
            var m, requestScript;
            
            if (path) {
                m = modules[path];
                if (!m) {
                    console.warn('Can not find module for path : ' + path);
                    return null;
                }
            }

            if ((!m || !m.isNodeModule) && nameMap[request]) {
                requestScript = modules[ nameMap[request] ];
            }
            else if (m) {
                requestScript = scripts[ m.deps[request] ];
            }
            
            if (!requestScript) {
                if (CC_JSB) {
                    return require(request);
                }
                else {
                    console.warn('Can not find deps [' + request + '] for path : ' + path);
                    return null;
                }
            }

            path = requestScript.file;
            m = modules[path];
            
            if (!m) {
                console.warn('Can not find module for path : ' + path);
                return null;
            }

            if (!m.module) {
                m.func();
            }

            if (!m.module) {
                console.warn('Can not find module.module for path : ' + path);
                return null;
            }

            return m.module.exports;
        };

        cc.registerModuleFunc = function (path, func) {
            modules[path].func = func;
        };
    },

    run: function () {
        var modules = this.modules;
        for (var path in modules) {
            var module = modules[path];
            if (!module.module) {
                module.func();
            }
        }
    }
};
