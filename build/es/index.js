import { readdirSync as a, existsSync as b } from 'fs';
import { join as c } from 'path';
function* d(b) {
    let e = a(b, {
        withFileTypes: !0
    });
    for (let f of e)f.isDirectory() ? yield* d(c(b, f.name)) : yield c(b, f.name);
}
let e = (a)=>{
    let b = [];
    for (let c of d(a))b.push(c);
    return b;
}, f = (a, { path: d = 'public' , prefix: f = '/public' , staticLimit: g = 1024 , alwaysStatic: h = !1 , ignorePatterns: i = []  } = {
    path: 'public',
    prefix: '/public',
    staticLimit: 1024,
    alwaysStatic: 'production' === process.env.NODE_ENV,
    ignorePatterns: []
})=>{
    let j = e(d), k = (a)=>i.find((b)=>'string' == typeof b ? b.includes(a) : b.test(a));
    return h || 'production' === process.env.NODE_ENV && j.length <= g ? j.forEach((b)=>{
        k(b) || a.get(`/${c(f, b.replace(`${d}/`, ''))}`, ()=>Bun.file(b));
    }) : a.get(`${f}/*`, ({ params: a  })=>{
        let c = `${d}/${a['*']}`;
        return k(c) ? new Response('Not Found', {
            status: 404
        }) : b(c) ? Bun.file(c) : new Response('Not Found', {
            status: 404
        });
    }), a;
};
export default f;

//# sourceMappingURL=index.js.map