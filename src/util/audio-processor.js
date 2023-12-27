export default (()=> `
class MyAudioProcessor extends AudioWorkletProcessor {
    constructor() {
      super();

      // Setup init data
      this.runtimeData = {};
      this.runtimeData.functions = {};
      this.runtimeData.globals = {};
      this.parameters = {};

      this.port.onmessage = event => {
        const { type, data } = event.data;
        console.log(type)
        if (type === "updateCode")
        {
          this.codeData = JSON.parse(data.codeData);
          this.updateCodeData();
        }
        else if (type === "updateParameters")
        {
          this.updateParameters(JSON.parse(data.parameterData));
        }
      };
    }

    updateParameters(parameterData) {

      this.parameters = {};

      for (const param of parameterData)
      {
        this.parameters[param.tag] = param.value;
      }

    }
   
    updateCodeData() {

      try {
      this.runtimeData.functions = {};

      for (const f of Object.keys(this.codeData.functions))
      {
        if (f !== "__init")
        {
          const funcData = this.codeData.functions[f];
          this.runtimeData.functions[f] = new Function(...funcData.parameters, "__functions", "__globals", "parameters", funcData.body);  
        }
      }

      // Run init to initialize Globals
      this.runtimeData.globals = {};
      this.runtimeData.functions.__init = new Function("__globals", "parameters", this.codeData.functions.__init.body);
      this.runtimeData.functions.__init(this.runtimeData.globals, this.parameters);
    } 
    catch (e) {
      this.port.postMessage({
        type: "error",
        data: "Error while initializing FX: " + e 
      })
    }
    }

    processAudio(inputs, outputs) {

      if (!this.runtimeData.functions.processAudio) {
        return true;
      }

      try {
        this.runtimeData.functions.processAudio(inputs, outputs, this.runtimeData.functions, this.runtimeData.globals, this.parameters);
      }
      catch (e) {
        this.port.postMessage({
          type: "error",
          data: "Error while processing audio: " + e 
        })
      }
      return true;
    }

    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];
   
      return this.processAudio(inputs, outputs);
    }
   }
   
   registerProcessor('my-audio-processor', MyAudioProcessor);
   `)(); // eslint-disable-line prefer-destructuring