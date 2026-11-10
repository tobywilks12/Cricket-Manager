const fs=require('fs');const d=__dirname+'/';
module.exports=function(files){files=files||['data.js','data_wb.js','engine.js','engine_lo.js','career.js'];
 const code=files.map(f=>fs.readFileSync(d+f,'utf8')).join('\n;\n')+'\nreturn {Engine, TEAMS, VENUES, STATES, BBL_CLUBS, Career: typeof Career!=="undefined"?Career:null, CW: typeof CW!=="undefined"?CW:null, g:(s)=>eval(s)};';
 return new Function(code)();}
