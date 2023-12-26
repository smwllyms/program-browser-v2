import "./DragNDrop.css"

import React from "react"
import * as d3 from "d3"

import AudioFXPlugin from "../../classes/AudioFXPlugin/AudioFXPlugin.js"
import GeneratorPlugin from "../../classes/GeneratorPlugin/GeneratorPlugin.js"
import Destination from "../../classes/Destination/Destination.js"

export default function DragNDrop(props)
{
    const pluginList = props.pluginList || [];
    const parentRef = React.useRef(null);

    let routeRefs= {
        inputs: pluginList.reduce((s,p)=>{
            const id = p.id;
            const ref = React.createRef();
            return {...s, [id] : ref};
        },{}),
        outputs: pluginList.reduce((s,p)=>{
            const id = p.id;
            const ref = React.createRef();
            return {...s, [id] : ref};
        },{})
    }

    const ref = React.useRef(null);
    const svgRef = React.useRef(null);

    function onMouseDownFunction(e, id)
    {
        if (id !== "-1")
        {
            e.stopPropagation();
        }
        props.selectPlugin(id);
    }

    // Drag events for connections
    const onStartConnection = (event, startId) => {

        let svg = d3.select(svgRef.current);

        const mousePos = d3.pointer(event, ref.current);
      
        let line = svg.append("line")
            .attr("x1", mousePos[0])
            .attr("y1", mousePos[1])
            .attr("x2", mousePos[0])
            .attr("y2", mousePos[1])
            .attr("stroke", "black")
            .attr("class", "dragging")

            event.stopPropagation();
      
            function onMove(e) {
                const pos = d3.pointer(e, ref.current);
                line
                    .attr("x2", pos[0])
                    .attr("y2", pos[1])
            } 
            parentRef.current.addEventListener("pointermove", onMove);

            function onUp(e)
            {
                const endId = e.target.getAttribute("_id");

                if (!endId || startId === endId)
                {
                    // Invalid
                }
                else
                {
                    console.log("connecting " + startId + " with " + endId);
                    props.createRoute(startId, endId);
                }

                line.remove();

                parentRef.current.removeEventListener("pointermove", onMove);
                parentRef.current.removeEventListener("pointerup", onUp);
            }
            parentRef.current.addEventListener("pointerup", onUp);
            // ref.current.addEventListener("pointerout", onUp);
    };


    // Draw routes
    React.useEffect(()=>{
        function drawConnections()
        {
            const sources = Object.keys(props.routes);
            let svg = d3.select(svgRef.current);
            svg.selectAll(".static").remove();

            for (const source of sources)
            {
                const destinations = props.routes[source];

                for (const destination of destinations)
                {
                    const src = routeRefs.outputs[source];
                    const dst = routeRefs.inputs[destination];
                    const rS = src.current.getBoundingClientRect();
                    const rD = dst.current.getBoundingClientRect();
                    svg.append("line")
                        .attr("key", (source + "->" + destination))
                        .attr("x1", rS.x + 10)
                        .attr("y1", rS.y - 30)
                        .attr("x2", rD.x + 10)
                        .attr("y2", rD.y - 30)
                        .attr("class", "static")
                        .attr("pointer-events", "all")
                        .on("click", function() {
                            props.removeRoute(source, destination)
                        });
                }           
            }
            // for (const line of lines)
            // {

            // };       
        }
        drawConnections();
    },[props, props.routes, routeRefs.inputs, routeRefs.outputs]);

    return (
        <div className="drag-n-drop-wrapper" 
            ref={parentRef}
            onMouseDown={e=>onMouseDownFunction(e,("-1"))}>
            <div className="svg-wrapper">
                <svg ref={svgRef}>
                </svg>
            </div>
            <div 
                className="drag-n-drop" 
                ref={ref}>
                {
                    pluginList.map(plugin=>{

                        if (plugin.type === "fx")
                        {
                            return <AudioFXPlugin 
                            key={plugin.id}
                            isSelected={props.selected === plugin.id}
                            pluginInfo={plugin}
                            onMouseDown={e=>onMouseDownFunction(e,plugin.id)}
                            startConnection={onStartConnection}
                            parentRef={ref}
                            inputRef={routeRefs.inputs[plugin.id]}
                            outputRef={routeRefs.outputs[plugin.id]}
                            updatePlugin={props.updatePlugin} />
                        }
                        else if (plugin.type === "generator")
                        {
                            return <GeneratorPlugin 
                            key={plugin.id}
                            isSelected={props.selected === plugin.id}
                            pluginInfo={plugin}
                            onMouseDown={e=>onMouseDownFunction(e,plugin.id)}
                            startConnection={onStartConnection}
                            parentRef={ref}
                            inputRef={routeRefs.inputs[plugin.id]}
                            outputRef={routeRefs.outputs[plugin.id]}
                            updatePlugin={props.updatePlugin} />
                        }
                        else
                        {
                            return <Destination 
                                key={plugin.id}
                                isSelected={props.selected === plugin.id}
                                pluginInfo={plugin}
                                onMouseDown={e=>onMouseDownFunction(e,plugin.id)}
                                parentRef={ref}
                                inputRef={routeRefs.inputs[plugin.id]}
                                updatePlugin={props.updatePlugin} />
                        }
                    })
                }
            </div>
        </div>
    )
}