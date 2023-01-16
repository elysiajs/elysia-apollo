"use strict";
Object.defineProperty(exports, "__esModule", {
    value: !0
}), Object.defineProperty(exports, "default", {
    enumerable: !0,
    get: ()=>f
});
const a = require("fs"), b = require("path");
function* c(d) {
    let e = (0, a.readdirSync)(d, {
        withFileTypes: !0
    });
    for (let f of e)f.isDirectory() ? yield* c((0, b.join)(d, f.name)) : yield (0, b.join)(d, f.name);
}
const d = (a)=>{
    let b = [];
    for (let d of c(a))b.push(d);
    return b;
}, e = (c, { path: e = 'public' , prefix: f = '/public' , staticLimit: g = 1024 , alwaysStatic: h = !1 , ignorePatterns: i = []  } = {
    path: 'public',
    prefix: '/public',
    staticLimit: 1024,
    alwaysStatic: 'production' === process.env.NODE_ENV,
    ignorePatterns: []
})=>{
    let j = d(e), k = (a)=>i.find((b)=>'string' == typeof b ? b.includes(a) : b.test(a));
    return h || 'production' === process.env.NODE_ENV && j.length <= g ? j.forEach((a)=>{
        k(a) || c.get(`/${(0, b.join)(f, a.replace(`${e}/`, ''))}`, ()=>Bun.file(a));
    }) : c.get(`${f}/*`, ({ params: b  })=>{
        let c = `${e}/${b['*']}`;
        return k(c) ? new Response('Not Found', {
            status: 404
        }) : (0, a.existsSync)(c) ? Bun.file(c) : new Response('Not Found', {
            status: 404
        });
    }), c;
}, f = e;

//# sourceMappingURL=index.js.map