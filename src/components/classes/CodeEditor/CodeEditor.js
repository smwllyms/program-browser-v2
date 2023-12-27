import "./CodeEditor.css"

import React from "react"

export default function CodeEditor(props)
{
    const textArea = React.useRef(null);
    const generatorTypeRef = React.useRef(null);

    function compile()
    {
        props.updateCode(textArea.current.value);
    }

    function loadSample()
    {
        textArea.current.value = sampleFXProgram();
    }

    function modifyPlugin()
    {
        const plugin = {...props.selectedPlugin};

        plugin.config.type = generatorTypeRef.current.value;

        props.updatePlugin(plugin, "updateCode")
    }

    if (props.selectedPlugin && props.selectedPlugin.type === "fx")
    {
        return (
            <div className="code-editor" key={props.selectedPlugin.id}>
                <textarea 
                    ref={textArea}
                    defaultValue={props.selectedPlugin.userCode}>

                </textarea>
                <div>
                    <a href="#load-sample" onClick={loadSample}>Load Sample</a>
                    <a href="#compile" onClick={compile}>Save & Compile</a>
                </div>
            </div>
        )
    }
    else if (props.selectedPlugin && props.selectedPlugin.type === "generator")
    {
        return (
            <div className="code-editor" key={props.selectedPlugin.id}>
                <h2>Generator Options</h2>
                <div>
                    <span>Type</span>
                    <select type="select"
                        defaultValue={props.selectedPlugin.config.type}
                        onChange={modifyPlugin}
                        ref={generatorTypeRef}>
                        {["sawtooth", "sine", "square"].map(v=>{
                            return <option key={v} value={v}>{v}</option>
                        })}
                    </select>
                </div>
            </div>
        )
    }
    else
    {
        return <h2 style={{width: "50%"}}>No Plugin Selected</h2>;
    }
    
}

function sampleFXProgram()
{
    return `\
int num = 1;\n\
float lfoRate = 1.0;\n\
float half(float val)\n\
{\n\
    return val / 2.0;\n\
}\n\
// Main processing function\n\
void processAudio(float **inputs, float **outputs)\n\
{\n\
    // Number of Inputs\n\
    for (int i = 0; i < inputs.length; i++)\n\
    {\n\
        float[] input = inputs[i];\n\
        float[] output = outputs[i];\n\
        // Number of channels\n\
        for (int j = 0; j < input.length; j++)\n\
        {\n\
            // Play with samples here!\n\
            int len = input[j].length;\n\
            for (int k = 0; k < len; k++)\n\
            {\n\
                output[j][k] = half(input[j][k]) * Math.sin(lfoRate * num / 10000);\n\
                num++;\n
            }\n\
        }\n\
    }\n\
}\n
    `;
}