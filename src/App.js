import './App.css';
import React from "react";
import { v4 } from "uuid"

// View
import Header from "./components/view/Header/Header.js"
import DragNDrop from "./components/view/DragNDrop/DragNDrop.js"
import Editor from "./components/view/Editor/Editor.js"
import Console from "./components/view/Console/Console.js"

import processorText from './util/audio-processor.js';

import compileCpptoJS from "./util/cpp2js/main.js"

const processorURL = URL.createObjectURL(new Blob([processorText], { type: 'text/javascript' }));

const audioContext = new AudioContext();
async function createAudioWorkletNode(audioContext) {
  await audioContext.audioWorklet.addModule(processorURL);
  return new AudioWorkletNode(audioContext, 'my-audio-processor');
}

const configKey = "program-browser-v2";
const destinationNode = destination();

let lastUpdated = new Date();

function App() {

  const initialized = React.useRef(false);

  const [config, setConfig] = React.useState(null);
  const [selected, setSelected] = React.useState("-1");
  const [pluginList, setPluginList] = React.useState([]);
  const [routes, setRoutes] = React.useState({});
  const [consoleData, setConsoleData] = React.useState(null);
  
  const workletNodesRef = React.useRef({[destinationNode.id]:audioContext.destination});
  const buildRoutesFuncRef = React.useRef(null);

  // Initialize
  React.useEffect(()=>{

    async function initialize()
    {
      const newConfig = await loadConfig();
      newConfig.plugins.push(destinationNode);
      setConfig(newConfig);
      initialized.current = true;
    }
    initialize();
    
  },[]);

  // Handle building routes
  React.useEffect(() => {

    buildRoutesFuncRef.current = async ()=>{

      const generators = pluginList.filter(p=>p.type==="generator");
      const fx = pluginList.filter(p=>p.type==="fx");
      const removedPlugins = [];

      let _workletNodes = {...workletNodesRef.current}

      // Remove all connections
      for (const node of Object.values(_workletNodes))
      {
        node.disconnect();
      }

      generators.reduce((s,g)=>{
        let gNode = _workletNodes[g.id];

        const directiveNames = g.directives.map(d => d.directive);

        if (directiveNames.includes("destroy"))
        {
          if (gNode)
          {
            // Delete worklet nodes
            delete _workletNodes[g.id];
            // Delete all outgoing routes
            delete routes[g.id];
            // Delete all incoming routes
            for (const key of Object.keys(routes))
            {
              if (routes[key].includes(g.id))
              {
                routes[key] = routes[key].filter(r=>r !== g.id);
              }
            }
          }

          // Add to removed pluugins
          removedPlugins.push(g.id);

          // pass/skip any futher directives
          return null;
        }


        if (!gNode)
        {
          gNode = audioContext.createOscillator();
          gNode.start();
          _workletNodes[g.id] = gNode;
        }
        gNode.type = g.config.type;
        gNode.frequency.setValueAtTime(g.config.frequency, audioContext.currentTime);
        return null;
      },[]);

      await fx.reduce(async (s,g)=>{

        let gNode = _workletNodes[g.id];

        const directiveNames = g.directives.map(d => d.directive);

        console.log(g)
        console.log(gNode)

        if (directiveNames.includes("destroy"))
        {
          if (gNode)
          {
            // Delete worklet nodes
            delete _workletNodes[g.id];
            // Delete all outgoing routes
            delete routes[g.id];
            // Delete all incoming routes
            for (const key of Object.keys(routes))
            {
              if (routes[key].includes(g.id))
              {
                routes[key] = routes[key].filter(r=>r !== g.id);
              }
            }
          }

          // Add to removed pluugins
          removedPlugins.push(g.id);

          // pass/skip any futher directives
          return null;
        }

        if (!gNode)
        {
          console.log("New node detected")
          gNode = await createAudioWorkletNode(audioContext);
          _workletNodes[g.id] = gNode;

          // Do not change parameters because we havent saved
        }

        if (directiveNames.includes("updateCode"))
        {
          const userCode = await compileCpptoJS(g.userCode);

          if (!userCode.error)
          {
            gNode.port.postMessage({ 
              type: "updateCode",
              data: {
                codeData: JSON.stringify(userCode)
              }
            });

            gNode.port.onmessage = msg=>{
              if (msg.data.type === "error")
              {
                setConsoleData("[" + g.id +  " ] Runtime error: " + userCode.data)
              }
            }

            // Update parameters since code has changed
            directiveNames.push("updateParameters")
          }
          else
          {
            setConsoleData("[" + g.id +  " ] Compilation error: " + userCode.message)
          }
          
        }
        if (directiveNames.includes("updateParameters"))
        {
          // Choice: dont check for compiler errors
              gNode.port.postMessage({ 
              type: "updateParameters",
              data: {
                parameterData: JSON.stringify(g.parameters)
              }
            });
            gNode.port.onmessage = msg=>{
              if (msg.data.type === "error")
              {
                setConsoleData("[" + g.id +  " ] Runtime error: " + msg.data.data)
              }
            }
          

        }
        if (directiveNames.includes("setBypass"))
        {
          gNode.port.postMessage({
            type: "setBypass",
            data: g.isBypassed
          });
        }
        if (directiveNames.includes("updateMix"))
        {
          gNode.port.postMessage({
            type: "updateMix",
            data: g.mix
          });
        }
        if (directiveNames.includes("updateTag"))
        {
          const otherData = g.directives.find(d=>d.directive === "updateTag").otherData;
          gNode.port.postMessage({
            type: "updateTag",
            data: {
              oldTag: otherData.oldTag,
              newTag: otherData.newTag
            }
          });
        }
        if (directiveNames.includes("gui")) {
          gNode.port.postMessage({ 
            type: "updateParameters",
            data: {
              parameterData: JSON.stringify(g.parameters)
            }});
        }
        return null;
      },[]);

      // Now connect routes
      for (const source of Object.keys(routes))
      {
        for (const destination of routes[source])
        {
          _workletNodes[source].connect(_workletNodes[destination]);
        }
      }

      // Update last updated
      lastUpdated = new Date();

      // Update worklet nodes
      workletNodesRef.current = _workletNodes;

      // Update plugin list
      const _pluginList = pluginList.filter(plugin=>!removedPlugins.includes(plugin.id));

      // Reset all plugin directives
      _pluginList.forEach(plugin=>plugin.directives = []);
      setPluginList(_pluginList);
    }
  });


  // Handle Update selected
  React.useEffect((e)=>{
    if (initialized.current === true)
    {
      // console.log(selected)
    }
  }, [selected])

  // Handle Update Plugin List
  React.useEffect((e)=>{
    if (initialized.current === true)
    {
      let shouldBuild = false;
      for (const p of pluginList)
      {
        if (p.lastUpdated === lastUpdated)
        {
          shouldBuild = true;
          break;
        }
      }
      if (shouldBuild)
      {
        buildRoutesFuncRef.current();
      }
    }
  }, [pluginList])

  // Handle update routes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect((e)=>{
    if (initialized.current === true)
    {
      buildRoutesFuncRef.current();
    }
  }, [routes])

  // Handle Update Config
  React.useEffect(()=>{
    if (initialized.current === true) 
    {
      setSelected(config.currentSelected);
      setPluginList(config.plugins);
    }
    
  }, [config]);

  // Handle select
  function select(id)
  {
    let found = false;
    for (const plugin of pluginList)
    {
      if (plugin.id === id)
      {
        found = true;
        break;
      }
    }
    setSelected(found ? id : "-1");
  }


  // For component convenience
  const selectedPlugin = pluginList.find(plugin=>plugin.id===selected);

  // New FX
  function addNewFXPlugin()
  {
    setPluginList([...pluginList, newFXPlugin()])
  }
  //New Generator
  function addNewGeneratorPlugin()
  {
    setPluginList([...pluginList, newGeneratorPlugin()])
  }


  // New GUI Parameter
  function addGUIParameter(type)
  {
    console.log(selected)
    if (selected !== "-1")
    {

      const plugin = selectedPlugin;
      // console.log(selected)
      // console.log(selectedPlugin)
      let childParam = null;
      let childGUI = null;

      let pNum = plugin.gui.view.children.length;

      switch (type)
      {
        case "label":
          childGUI = {
            id: v4().toString(),
            type: "label",
            position: {
              x: 50, y: 50
            },
            width: 200,
            text:"Change me!"
          }
          break;
        default:
          childParam = {
            type: "decimal",
            tag: "param"+pNum,
            value: 0.75,
            granularity: 0,
            default: 0.75,
            min: -1,
            max: 1
          }
          childGUI = {
            id: v4().toString(),
            type: "slider",
            tag: "param"+pNum,
            position: {
              x: 50, y: 50
            },
            width: 200,
          }
          break;
      }

      plugin.gui.view.children.push(childGUI);
      if (childParam != null)
        plugin.parameters.push(childParam);

      updatePlugin(plugin, "gui")
    }
  }

  function deleteGUIParameter() {
    // selectedPlugin.gui.view.children = selectedPlugin.gui.view.children.filter(c => c.id !== lastModifiedGUIId);
    updatePlugin(selectedPlugin, "gui")
  }

  function updatedSelectedCode(code)
  {
    selectedPlugin.userCode = code;
    const newDate = new Date();
    selectedPlugin.lastUpdated = newDate;
    lastUpdated = newDate;
    selectedPlugin.directives.push({directive:"updateCode"});
    setPluginList([...pluginList.filter(p=>p.id !== selectedPlugin.id), selectedPlugin])
  }

  function updatePlugin(plug, directive, otherData)
  {
    const plugin = pluginList.find(p=>p.id===plug.id);
    // console.log(directive)
    if (directive !== "metadata")
    {
      const newDate = new Date();
      plugin.lastUpdated = newDate;
      lastUpdated = newDate;
      plugin.directives.push({directive:directive, otherData:otherData});
    }
    setPluginList([...pluginList.filter(p=>p.id !== plugin.id), plugin])
  }

  // Create a connection
  function createRoute(source, destination)
  {
    const _routes = {...routes};
    _routes[source] ||= [];
    _routes[source].push(destination);

    setRoutes(_routes);
  }

  function removeRoute(source, destination)
  {
    const _routes = {...routes};
    _routes[source] = _routes[source].filter(id=>id !== destination);

    if (_routes[source].length === 0)
    {
      delete _routes[source];
    }

    setRoutes(_routes);
  }

  function sampleFXProgram() {
    selectedPlugin.gui = defaultGUI();
    selectedPlugin.parameters = [
      {
        type: "decimal",
        tag: "lfo-rate",
        value: 0.75,
        granularity: 0,
        default: 0.75,
        min: -1,
        max: 1
      }
    ]
    updatedSelectedCode(sampleFXProgramCode())
  }

  return (
    <div className="App">
      <Header 
        addNewFXPlugin={addNewFXPlugin}
        addNewGeneratorPlugin={addNewGeneratorPlugin}
        addGUIParameter={addGUIParameter}
        selectedPlugin={selectedPlugin}
        deleteGUIParameter={deleteGUIParameter}/>
      <DragNDrop 
        selected={selected}
        selectPlugin={select}
        pluginList={pluginList}
        updatePlugin={updatePlugin}
        routes={routes}
        createRoute={createRoute}
        removeRoute={removeRoute}/>
      <Editor 
        selectedPlugin={selectedPlugin}
        updatePlugin={updatePlugin}
        updateCode={updatedSelectedCode}
        sampleFXProgram={sampleFXProgram}/>
      <Console
        text={consoleData} />
    </div>
  );
}

async function loadConfig(url)
{
  let config = localStorage.getItem(configKey);

  if (url !== undefined)
  {
    return newConfig();
  }
  else if (config !== null)
  {
    return config;
  }
  else
  {
    return newConfig();
  }
}

function newConfig()
{
  return {
    lastUpdated: new Date(),
    currentSelected: "-1", // would be id
    plugins: []
  }
}

function newFXPlugin()
{
  return {
    id: v4().toString(),
    type: "fx",
    name: "TestFX",
    directives: [],
    lastUpdated: new Date(),
    isBypassed: false,
    mix: 1.0,
    userCode: "// Create a process function (click load sample for an idea)",
    metadata: {
      coordinates: {x:0,y:0}
    },
    parameters: [
    ],
    gui: emptyGUI()
  }
}
function newGeneratorPlugin()
{
  return {
    id: v4().toString(),
    type: "generator",
    name: "Generator",
    directives: [],
    lastUpdated: new Date(),
    config: {
      type: "sine", // saw, square, custom
      volume: 0.5, // 0-1
      frequency: 440 // Hz
    },
    metadata: {
      coordinates: {x:0,y:0}
    }
  }
}

function destination()
{
  return {
    id: v4().toString(),
    type: "destination",
    name: "Destination",
    directives: [],
    lastUpdated: new Date(),
    metadata: {
      coordinates: {x:0,y:0}
    }
  }
}

function emptyGUI()
{
  return {
    view: {
      type: "view",
      position: {
        x: 0, y: 0
      },
      width: 400,
      height: 200,
      background: "#ffffff",
      children: []
    }
  }
}

function defaultGUI()
{
  return {
    view: {
      type: "view",
      position: {
        x: 0, y: 0
      },
      width: 400,
      height: 200,
      background: "#ffffff",
      children: [
        {
          id: v4().toString(),
          type: "slider",
          tag: "lfo-rate",
          position: {
            x: 50, y: 50
          },
          width: 200,
        },
        {
          id: v4().toString(),
          type: "label",
          position: {
            x: 50, y: 70
          },
          width: 200,
          text:"A label for lfo-rate"
        }
      ]
    }
  }
}

function sampleFXProgramCode()
{
    return `\
int num = 1;\n\
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
                output[j][k] = half(input[j][k]) * Math.sin(num * parameters["lfo-rate"] / 10000);\n\
                num++;\n
            }\n\
        }\n\
    }\n\
}\n
    `;
}

export default App;
