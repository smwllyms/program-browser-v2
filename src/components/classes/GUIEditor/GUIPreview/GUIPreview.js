import "./GUIPreview.css"

import React from "react"

export default function GUIPreview(props)
{
    const viewData = props.gui.view;
    const parameterData = props.parameters;

    let key = 0;

    function handleChange(e, id, tag, otherData)
    {
        // console.log(id, tag, otherData, e.target.value)

        // Derive normalized value
        let param = parameterData.find(p=>p.tag === tag);

        if (param.type === "decimal")
        {
            let normalizedValue = e.target.value / otherData.granularity;
            // console.log(normalizedValue)
            props.handleModifyParameter(tag, normalizedValue);
        }
    }

    function buildGUIRecursive(elem, arr)
    {
        // Build first
        let style = {};
        let content = undefined;
        let id = key++;

        style.position = "absolute";
        style.left = elem["position"].x + "px"
        style.top = elem["position"].y + "px"

        if (elem.type === "view")
        {
            style.width = elem["width"];
            style.height = elem["height"];
            style["background"] = elem.background;

            arr.push(<div
                style={style}
                key={key++}
                parentid={elem.parentid}>
                    {content}</div>)
        }
        else if (elem.type === "slider")
        {
            const otherData = {
                range: elem.max - elem.min,
                granularity: elem.granularity === 0 ? 9999 : elem.granularity,
                min: elem.min,
                max: elem.max,
                default: elem.default
            }


            arr.push( <input
                type="range"
                min={0}
                max={otherData.max * otherData.granularity}
                defaultValue={otherData.default * otherData.granularity}
                style={style}
                onChange={e=>handleChange(e, elem.type, elem.tag, otherData)}
                key={id}
                parentid={elem.parentid} />)

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
        let elems = [];

        for (const e in result)
        {
            const children = elems.filter(e2=>e2.props.parentid === result[e].key);
            elems.push(React.cloneElement(result[e], {}, children.length > 0 ? children : undefined));
        }

        return elems;
    }

    return (
        <div className="gui-preview">
            {buildGUI(viewData)}
        </div>
    )
}