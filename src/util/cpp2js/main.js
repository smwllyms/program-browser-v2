
const types = ["float", "void", "int", "long", "double"];

// export default async function(code, log)
// {
//     let stringCode = code;
//     console.log(stringCode);
//     // 1. Convert from CPP to JS

//     let regex = new RegExp('\\s*(' + types.join('|') + ')\\s+(\\w+)\\s*\\((.*?)\\)\\s*{', 'gs');

//     let matches = Array.from(stringCode.matchAll(regex));

//     matches.forEach(match => {
//     let type = match[1]; // The type of the function
//     let name = match[2]; // The name of the function
//     let params = match[3].split(',').map(param => param.trim()); // The parameters of the function
//     console.log(`Found function ${name} of type ${type} with parameters: ${params}`);
//     });

//     // Functions
//     // const regexKeys = new RegExp('^\\s*(' + keys.join('|') + ')\\s+(\\w+)\\s*\\(', 'gm');
//     // const fKeys = Array.from(newCode.matchAll(regexKeys));
//     // console.log(regexKeys)
//     // fKeys.forEach(match => {
//     //  let type = match[1]; // The type of the function
//     //  let name = match[2]; // The name of the function
//     //  console.log(`Found function ${name} of type ${type}`);
//     // });

    
// }

// export default async function(code, log)
// {
//     let types = ['float', 'int', 'void', 'double']; // Add or remove types as needed
// let regexFuncStart = new RegExp('\\s*(' + types.join('|') + ')\\s+(\\w+)\\s*\\((.*?)\\)\\s*\\{', 'gs');
// let stringCode = code.replace(/[\r\n]+/gm, " ").replace(/[\t ]+/gm, " "); // Your C++ code
// console.log(stringCode)

// let funcStartMatches = Array.from(stringCode.matchAll(regexFuncStart));

// funcStartMatches.forEach(match => {
//  let type = match[1]; // The type of the function
//  let name = match[2]; // The name of the function
//  let params = match[3].split(',').map(param => param.trim()); // The parameters of the function

//  // Find the end of the function body
//  let depth = 1;
//  let bodyLines = [];
//  while (depth > 0) {
//  let index = stringCode.indexOf('\n', match.index);
//  if (index === -1) break;
//  let nextLine = stringCode.slice(match.index, index);
//  bodyLines.push(nextLine);
//  depth += (nextLine.match(/\{/) || []).length - (nextLine.match(/\}/) || []).length;
//  match.index = index + 1;
//  }

//  let body = bodyLines.join('\n');
//  console.log(`Found function ${name} of type ${type} with parameters: ${params}\n${body}`);
// });

// }
export default function f(code)
{
    // Very, very nonexpert way of doing this

    // Remove comments
    code = code.replace(/\/\/.*\n/g, "\n");
    
    // Remove asterisk (pointers), assume code will work (lol)
    // it will give error when compiled in audio worklet
    const pointerREs = RegExp('(' + types.join('|') + ')\\s*\\*+', 'gs');
    code = code.replaceAll(pointerREs, "let ");

    // Same for brackets
    const arrayREs = RegExp('(' + types.join('|') + ')\\s*\\[\\]', 'gs');
    code = code.replaceAll(arrayREs, "let ");

    // Now remove types 
    const typeREs = RegExp('(' + types.join('|') + ')\\s*', 'gs');
    code = code.replaceAll(typeREs, "let ");

    // Now identify functions
    const functionRE = /let\s+(\w+)\s*\(/g;
    let newStr = code;
    let functions = []
    let functionInfo = {};

    // Record function names and replace
    while (functionRE.test(newStr)) {
        newStr = newStr.replace(functionRE, function(match, p1) {
            functionInfo[p1] = {};
            functions.push(p1);
            return 'function ' + p1 + ' (';
        });
    }
    code = newStr;

    // Record parameter names and function bodies
    const newFunctionRE = /function\s+(\w+)\s*\(/g;
    Array.from(code.matchAll(newFunctionRE)).forEach((match,n)=>{

        const index = match.index;
        const functionStart = code.indexOf("{",index + match[0].length) + 1;

        // First get parameters
        const paramStart = code.indexOf("(", index) + 1;
        const paramEnd = code.indexOf(")", index);
        const paramString = code.substring(paramStart, paramEnd).replace(/let\s+/g, "").replace(/\s+/g, "");
        const parameters = paramString.split(",");

        // console.log(match);
        // console.log(n);

        // Then get function body
        let bodyStart = functionStart;
        let pos = bodyStart;
        let depth = 1;
        while (depth > 0)
        {
            if (code[pos] === "{")
            {
                depth++;
            }
            else if (code[pos] === "}")
            {
                depth--;
                if (depth <= 0)
                {
                    pos--
                    break;
                }
            }

            pos++;
        }
        let bodyEnd = pos;
        let body = code.substring(bodyStart, bodyEnd);

        // Add to function
        functionInfo[functions[n]] = {
            parameters: parameters,
            body: body,
            indices: {
                start: index,
                end: bodyEnd + 2
            }
        }
    });
    
    // Now find globals
    const globals = {};
    // We need to remove all functions
    let clone = "";
    let index = 0;
    for (const f of functions)
    {
        clone += code.substring(index, functionInfo[f].indices.start);
        index = functionInfo[f].indices.end;
    }
    clone += code.substring(index);

    // Remove excess spacing
    clone = clone.replace(/ {2,}/g, " ");
    // Remove excess newlines
    clone = clone.replace(/\n{2,}/g, "\n");
    // Isolate each global
    const globalLines = clone.split("\n").filter(s=>s.length>2).map(s=>s.replace(/^let /, ""));
    // Now register them
    globalLines.forEach(line=>{
        const name = line.match(/^\w{2,} /)[0].replaceAll(/\s+/g,"");
        globals[name] = line;
    })
    
    // Great! Now we have all the info we need
    // We will basically replace all function calls and global accesses
    // To make our lives a tad easier, we will pad our code with spaces
    code = " " + code + " ";

    // Note that both must start with whitespace or semicoloc on the left
    const left = ["\\;", "\\s", "\\(", "\\["];
    // On the right, functions may have whitespace or the open parentheses
    const functionRight = ["\\s", "\\("];
    // On the right, globals may have whitespace or an operator
    const globalRight = ["\\s", "\\+", "\\-", "\\[", "\\*", "\\/", "\\.", "\\;", "\\,"]

    for (const funcBodyFunc of functions)
    {
        let body = functionInfo[funcBodyFunc].body;
        for (const f of functions)
        {
            const re = new RegExp('(' + left.join('|') + ')(' + f + ')(' + functionRight.join('|') + ')', 'g');
            body = body.replace(re, function(match, p1, p2, p3) {
                return p1 + "__functions[\"" + f + "\"]" + p3;
            });
        }
        // Next, replace all globals
        for (const g of Object.keys(globals))
        {
            const re = new RegExp('(' + left.join('|') + ')(' + g + ')(' + globalRight.join('|') + ')', 'g');
            body = body.replace(re, function(match, p1, p2, p3) {
                return p1 + "__globals[\"" + g + "\"]" + p3;
            });
        }
        functionInfo[funcBodyFunc].body = body;
    }

    for (const global of Object.keys(globals))
    {
        let globalInitCode = globals[global];
        globalInitCode = " " + globalInitCode + " ";
        for (const f of functions)
        {
            const re = new RegExp('(' + left.join('|') + ')(' + f + ')(' + functionRight.join('|') + ')', 'g');
            globalInitCode = globalInitCode.replace(re, function(match, p1, p2, p3) {
                return p1 + "__functions[\"" + f + "\"]" + p3;
            });
        }
        // Next, replace all globals
        for (const g of Object.keys(globals))
        {
            const re = new RegExp('(' + left.join('|') + ')(' + g + ')(' + globalRight.join('|') + ')', 'g');
            globalInitCode = globalInitCode.replace(re, function(match, p1, p2, p3) {
                return p1 + "__globals[\"" + g + "\"]" + p3;
            });
        }
        globals[global] = globalInitCode;
    }

    // Create an init function
    let initFunctionBody = "";
    for (const global of Object.keys(globals))
    {
        initFunctionBody += globals[global] + ";";
    }
    functionInfo["__init"] = {
        body: initFunctionBody,
        parameters: ["__globals"]
    }
    

    return {
        functions: functionInfo,
        globals: Object.keys(globals)
    }
}