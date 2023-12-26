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
      console.log(newConfig)
      setConfig(newConfig);
      initialized.current = true;
    }
    initialize();
    
  },[]);

  // Handle building routes
  React.useEffect(() => {

    buildRoutesFuncRef.current = async ()=>{
      console.log("Building routes")

      const generators = pluginList.filter(p=>p.type==="generator");
      const fx = pluginList.filter(p=>p.type==="fx");

      let _workletNodes = {...workletNodesRef.current}

      // Remove all connections
      for (const node of Object.values(_workletNodes))
      {
        node.disconnect();
      }

      generators.reduce((s,g)=>{
        let gNode = _workletNodes[g.id]
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
        let gNode = _workletNodes[g.id]
        if (!gNode)
        {
          gNode = await createAudioWorkletNode(audioContext);
          console.log(gNode)
          _workletNodes[g.id] = gNode;
        }

        if (g.directives.includes("shouldUpdateCode"))
        {
          const userCode = await compileCpptoJS(g.userCode);

          if (!userCode.error)
          {
            gNode.port.postMessage({ 
              type: "update",
              data: {codeData: JSON.stringify(userCode)}
            });
            gNode.port.onmessage = msg=>{
              if (msg.type === "error")
              {
                setConsoleData("[" + g.id +  " ] Runtime error: " + userCode.data)
              }
            }
          }
          else
          {
            setConsoleData("[" + g.id +  " ] Compilation error: " + userCode.message)
          }
          
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

      // Reset all plugin directives
      pluginList.forEach(plugin=>plugin.directives = []);
      setPluginList(pluginList);
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
        console.log("should build")
        buildRoutesFuncRef.current();
      }
    }
  }, [pluginList])

  // Handle update routes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect((e)=>{
    if (initialized.current === true)
    {
      console.log("Updated routes detected")
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

  // For component convenience
  const selectedPlugin = pluginList.find(plugin=>plugin.id===selected);

  function updatedSelectedCode(code)
  {
    selectedPlugin.userCode = code;
    const newDate = new Date();
    selectedPlugin.lastUpdated = newDate;
    selectedPlugin.directives.push("shouldUpdateCode");
    lastUpdated = newDate;
    setPluginList([...pluginList.filter(p=>p.id !== selectedPlugin.id), selectedPlugin])
  }

  function updatePlugin(plug, isMetaData)
  {
    const plugin = pluginList.find(p=>p.id===plug.id);
    if (!isMetaData)
    {
      const newDate = new Date();
      plugin.lastUpdated = newDate;
      lastUpdated = newDate;
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

  return (
    <div className="App">
      <Header 
        addNewFXPlugin={addNewFXPlugin}
        addNewGeneratorPlugin={addNewGeneratorPlugin}
        selectedPlugin={selectedPlugin}/>
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
        updateCode={updatedSelectedCode}/>
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
    userCode: "// Create a process function (click load sample for an idea)",
    metadata: {
      coordinates: {x:0,y:0}
    }
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

export default App;
