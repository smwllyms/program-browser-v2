import "./GeneratorPlugin.css"

import React from "react"
import * as d3 from "d3"

export default function GeneratorPlugin(props)
{
    const ref = React.useRef(null);
    const outputRef = props.outputRef;

    const _c = props.pluginInfo.metadata.coordinates || {x:0, y:0};
    const [coordinates, setCoordinates] = React.useState(_c)

    const plugin = props.pluginInfo
    const id = plugin.id;

    // Handle generic mouse down
    function onMouseDown(e, wasBody) {
        onStartMove(e);

        if (wasBody)
        {
            props.onMouseDown(e, id);
        }
    }

    // Handling start of connection
    function onStartConnection (e) {
        // onDragStart={e=>props.startDrag(e,props.pluginInfo.id)
        props.startConnection(e, id);
    }
    
    // Drag events for moving
    const onStartMove = (event) => {

        const initMousePos = d3.pointer(event, props.parentRef.current);

        function onMove(e) {
            const mousePos = d3.pointer(e, props.parentRef.current);
            mousePos[0] -= initMousePos[0];
            mousePos[1] -= initMousePos[1];
            
            const newCoords = {
                x: coordinates.x + mousePos[0],
                y: coordinates.y + mousePos[1]
            }

            // Make sure within boundaries
            const parentRect = props.parentRef.current.getBoundingClientRect();
            const myRect = ref.current.getBoundingClientRect();
            newCoords.x = Math.max(0, newCoords.x);
            newCoords.y = Math.max(0, newCoords.y);
            newCoords.x = Math.min(parentRect.width - myRect.width, newCoords.x);
            newCoords.y = Math.min(parentRect.height - myRect.height, newCoords.y);

            setCoordinates(newCoords);
            props.updatePlugin(plugin, true)
        } 
        props.parentRef.current.addEventListener("pointermove", onMove);

        function onUp(e)
        {
            props.parentRef.current.removeEventListener("pointermove", onMove);
            props.parentRef.current.removeEventListener("pointerup", onUp);

            plugin.metadata.coordinates = coordinates;

            props.updatePlugin(plugin, true)
        }
        props.parentRef.current.addEventListener("pointerup", onUp);

        event.stopPropagation();
    }

    return (
        <div 
            className="generatorplugin" 
            style={{top:coordinates.y, left:coordinates.x}}
            ref={ref}
            onMouseDown={onMouseDown}>            
            <div className="body"
                onMouseDown={e=>onMouseDown(e,true)}
                style={
                    (props.isSelected ? {border:"4px solid red"} : {})
                    }>
                <span>{props.pluginInfo.name}</span>
            </div>
            <a 
                href="#output" 
                className="output"
                draggable="false"
                ref={outputRef}
                onMouseDown={onStartConnection}>o</a>
        </div>
    )
}