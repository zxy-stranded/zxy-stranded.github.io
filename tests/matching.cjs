const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/people.json'),'utf8'));
const browserData=fs.readFileSync(path.join(root,'dist/apps/portrait/people-data.js'),'utf8');
const source=fs.readFileSync(path.join(root,'dist/apps/portrait/app.js'),'utf8');
const context={window:{},document:{querySelector(){return null},querySelectorAll(){return[]}},localStorage:{getItem(){return null}},setTimeout,clearTimeout};
vm.createContext(context);vm.runInContext(browserData,context);
vm.runInContext(source.slice(0,source.lastIndexOf("document.querySelectorAll('[data-view]')")),context);
assert.equal(data.length,500);
assert.deepEqual(JSON.parse(JSON.stringify(context.window.PORTRAIT_PEOPLE)),data,'浏览器数据应与JSON一致');
for(const field of ['name','v','tags','desc','advice'])assert.equal(new Set(data.map(p=>JSON.stringify(p[field]))).size,500,field+' 不应复用');
for(const p of data){context.input=p.v;const actual=vm.runInContext('rankPeople(input)[0]',context);assert.equal(actual.p.id,p.id,'每份独立向量应最近于自身');assert.equal(actual.distance,0);assert.equal(actual.match,100)}
context.input=data[0].v;assert.equal(vm.runInContext('rankPeople(input)[0].p.name',context),data[0].name);
// 以独立实现核对真实答题产生的最近人物，避免只验证实现自己的结论。
let seed=83;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const seen=new Set();
for(let k=0;k<10000;k++){
 const values=Array.from({length:16},()=>Math.floor(random()*4));context.testAnswers=values;
 const result=vm.runInContext('answers=testAnswers;calculate()',context);seen.add(result.p.name);
 const scores=vm.runInContext('scoreAnswers(testAnswers)',context);const sum=scores.reduce((a,b)=>a+b,0),u=scores.map(v=>v/sum);
 const distances=data.map(p=>{const total=p.v.reduce((a,b)=>a+b,0);return Math.hypot(...p.v.map((v,i)=>v/total-u[i]))});
 const expected=Math.min(...distances);assert(Math.abs(result.distance-expected)<1e-12,'必须返回500人中的最短距离');
 if(k<20){const again=vm.runInContext('calculate()',context);assert.equal(again.p.id,result.p.id,'同答案应稳定')}
}
console.log(`通过：500份独立配置、自身向量匹配、10000组答案最近邻与确定性校验；样本触达 ${seen.size} 位人物。`);
