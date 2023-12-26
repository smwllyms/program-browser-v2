import "./Console.css"

export default function Console(props)
{
    return (
        <div className="console">
            <h2>Console</h2>
            <p>{(props.text || "Messages and errors will show here")}</p>
        </div>
    )
}