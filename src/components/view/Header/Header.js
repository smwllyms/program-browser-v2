import "./Header.css"

export default function Header(props)
{
    const selected = props.selectedPlugin;
    const name = selected ? selected.name : "None";
    return (
        <div className="header">
            <div style={{float:"left"}}>
                <a href="#newfx" onClick={props.addNewFXPlugin}>Add FX</a>
                <a href="#new-generator" onClick={props.addNewGeneratorPlugin}>Add Generator</a>
            </div>
            <div style={{float:"right"}}>
                <span>Currently selected: {name}</span>
            </div>
            
        </div>
    )
}