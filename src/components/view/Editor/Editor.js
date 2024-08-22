import "./Editor.css"

import CodeEditor from "../../classes/CodeEditor/CodeEditor.js"
import GUIEditor from "../../classes/GUIEditor/GUIEditor.js"

export default function Editor(props)
{

    function updateCode (code)
    {
        props.updateCode(code);
    }

    return (
        <div className="editor">
            <CodeEditor 
                selectedPlugin={props.selectedPlugin}
                updateCode={updateCode}
                updatePlugin={props.updatePlugin}
                sampleFXProgram={props.sampleFXProgram}/>
            <GUIEditor 
                selectedPlugin={props.selectedPlugin}
                updatePlugin={props.updatePlugin}/>
        </div>
    )
}