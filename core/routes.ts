
import * as fs from 'fs';
import * as path from 'path';
import * as Router from 'koa-router';
import {global} from "./global-variable";
declare const require: any;

//本工具默认配置
let config = {
    'scan-path': 'routes',//route存放路径
};

//获取项目根路径
const getRootPath = (temPath) => {
    while (true) {
        let file = fs.readdirSync(temPath);
        for (let i = 0; i < file.length; i++) {
            if (file[i] === 'route.json') {
                return temPath;
            }
        }
        if (temPath === path.dirname(temPath)) return undefined;
        else temPath = path.dirname(temPath);
    }
};

let routesPath = getRootPath(path.normalize(path.dirname(require.main.filename))) + path.sep + config['scan-path'];
const file = fs.readdirSync(routesPath);
let router: Router = new Router();
for (let ts of file) {
    let filepath = routesPath + path.sep + ts;
    require(filepath);
    let loop=(ctrlAttr)=>{
        for (let [config, controller] of global.routes) {
            let controllers = Array.isArray(controller) ? controller : [controller];
            for (let controller of controllers) {
                const fInters = global.funcInterceptors.get(controller.name);
                router[config.type](`/${global.ctrls}/${config.path}`,
                    async (ctx, next) => {
                        const check = global.ctrlInterceptors.every(interceptor => new interceptor().intercept(ctx, next)) && fInters.every(interceptor => new interceptor().intercept(ctx, next));
                        if (check) {
                            await controller.apply(ctrlAttr, [ctx, next]);
                        } else {
                            ctx.throw(401, 'server error');
                        }
                    });
            }
        }
    }
    loop(global.ctrlAttr);
    global.reset();
}


export default router;