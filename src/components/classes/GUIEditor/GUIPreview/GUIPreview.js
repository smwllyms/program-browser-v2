import "./GUIPreview.css"

import React from "react"

let eventSetup = false;
let canDrag = false;
let lastPos = {x: 0, y: 0};

export default function GUIPreview(props)
{
    const guiData = props.gui;
    const viewData = guiData.view;
    const parameterData = props.parameters;

    const inEditMode = props.inEditMode;

    const [selectedElem, setSelectedElem] = React.useState(null);

    const elemMap = {};

    let key = 0;

    function handleChange(e, id, tag, otherData)
    {
        // console.log(id, tag, otherData, e.target.value)

        // Derive normalized value
        let param = parameterData.find(p=>p.tag === tag);

        if (param) {
            if (param.type === "decimal")
            {
                let normalizedValue = e.target.value / otherData.granularity;
                // console.log(normalizedValue)
                props.handleModifyParameter(tag, normalizedValue);
            }
        }
        else {
            if (id === "label") {
                const elem = Object.values(elemMap).find( e2 => e2.id === tag);
                elem.text = e.target.innerText;
                props.handleModifyGUI(guiData, false);
            }
        }
    }

    function handlePointerDown(e, elem)
    {
        canDrag = true;
        lastPos = {x: e.clientX, y: e.clientY};
        setSelectedElem(elem);
    }

    function handlePointerUp(e)
    {
        canDrag = false;
    }
    if (!eventSetup)
    {
        window.addEventListener("pointerup", handlePointerUp);
        eventSetup = true;
    }

    function handlePointerMove(e, key)
    {
        if (!canDrag)
        {
            return;
        }

        let elemPos = elemMap[key].position;
        let currentPos = { x: e.clientX, y: e.clientY };

        // Update elems position
        elemMap[key].position = {
            x: elemPos.x + currentPos.x - lastPos.x,
            y: elemPos.y + currentPos.y - lastPos.y
        };

        lastPos = {x: e.clientX, y: e.clientY};
        props.handleModifyGUI(guiData, false);
    }

    function buildGUIRecursive(elem, arr)
    {
        // Build first
        let style = {};
        let content = undefined;
        let id = key++;
        let onPointerMove = (e=>{});

        elemMap[id] = elem;

        // Get parent
        let parent = elemMap[elem.parentid] || {
            position: {
                x: 0,
                y: 0
            }
            
        }


        style.position = "absolute";
        style.left = parent["position"].x + elem["position"].x + "px"
        style.top = parent["position"].y + elem["position"].y + "px"

        if (inEditMode && selectedElem && elem.tag === selectedElem.tag)
        {
            style["border"] = "3px dashed white";
            style["outline"] = "3px dashed black";

            onPointerMove = handlePointerMove;
        }

        if (elem.type === "view")
        {
            style.width = elem["width"];
            style.height = elem["height"];
            style["background"] = elem.background;

            arr.push(<div
                style={style}
                key={id}
                onPointerDown={e=>handlePointerDown(e, elem)}
                onPointerMove={e=>onPointerMove(e, id)}
                parentid={elem.parentid}>
                    {content}</div>)
        }
        else if (elem.type === "slider")
        {
            let param = parameterData.find(p=>p.tag === elem.tag);
            const otherData = {
                range: param.max - param.min,
                granularity: param.granularity === 0 ? 9999 : param.granularity,
                min: param.min,
                max: param.max,
                default: param.default
            }


            arr.push( <input
                type="range"
                min={0}
                max={otherData.max * otherData.granularity}
                defaultValue={otherData.default * otherData.granularity}
                style={style}
                onPointerDown={e=>handlePointerDown(e,  elem)}
                onPointerMove={e=>onPointerMove(e, id)}
                disabled={inEditMode}
                onChange={e=>handleChange(e, elem.type, elem.tag, otherData)}
                key={id}
                parentid={elem.parentid} />)

        }
        else if (elem.type === "label")
        {
            const otherData = {
            }

            arr.push( <span
                style={style}
                disabled={inEditMode}
                contentEditable={inEditMode}
                onInput={e=>handleChange(e, elem.type, elem.id, otherData)}
                onPointerDown={e=>handlePointerDown(e,  elem)}
                onPointerMove={e=>onPointerMove(e, id)}
                suppressContentEditableWarning={true}
                key={id}
                parentid={elem.parentid}>
                    {elem.text}
                </span>)

        }


        // Recursive depth first search
        if (elem.children)
        {
            for (const child of elem.children)
            {
                child.parentid = id;
                buildGUIRecursive(child, arr)
            }
        }
    }

    function buildGUI(view)
    {
        let result = [];
        view.parentid = -1;
        buildGUIRecursive(view, result);
        // let elems = [];

        // for (const e in result)
        // {
        //     const children = elems.filter(e2=>e2.props.parentid === result[e].key);
        //     let cloneElem = React.cloneElement(result[e], {}, children.length > 0 ? children : undefined);

        //     elems.push(cloneElem);
        // }

        return result;
    }

    return (
        <div className="gui-preview">
            {buildGUI(viewData)}
        </div>
    )
}