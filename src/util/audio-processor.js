export default (()=> `
class MyAudioProcessor extends AudioWorkletProcessor {
    constructor() {
      super();

      // Setup init data
      this.runtimeData = {};
      this.runtimeData.functions = {};
      this.runtimeData.globals = {};
      this.parameters = {};
      this.isBypassed = false;
      this.mix = 1.0;

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
        else if (type === "setBypass")
        {
          this.isBypassed = data;
        }
        else if (type === "updateMix")
        {
          this.mix = data;
        }
      };

    }

    updateParameters(parameterData) {

      this.parameters = {};

      for (const param of parameterData)
      {
        let scale = param.max - param.min;
        this.parameters[param.tag] = param.value * scale - param.min;
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

    bypass(inputs, outputs)
    {

      // Number of Inputs
      for (let i = 0; i < inputs.length; i++)
      {
          const input = inputs[i];
          const output = outputs[i];
          // Number of channels
          for (let j = 0; j < input.length; j++)
          {
              let len = input[j].length;
              for (let k = 0; k < len; k++)
              {
                  output[j][k] = input[j][k];
              }
          }
      }      
    }

    mixAudio(inputs, outputs)
    {

      // Number of Inputs
      for (let i = 0; i < inputs.length; i++)
      {
          const input = inputs[i];
          const output = outputs[i];
          // Number of channels
          for (let j = 0; j < input.length; j++)
          {
              let len = input[j].length;
              for (let k = 0; k < len; k++)
              {
                  output[j][k] = this.mix * output[j][k] + (1.0 - this.mix) * input[j][k];
              }
          }
      }      
    }

    processAudio(inputs, outputs) {

      if (!this.runtimeData.functions.processAudio) {
        return true;
      }

      if (this.isBypassed)
      {
        this.bypass(inputs, outputs);
        return true;
      }

      try {
        this.runtimeData.functions.processAudio(inputs, outputs, this.runtimeData.functions, this.runtimeData.globals, this.parameters);
      }
      catch (e) {
        this.port.postMessage({
          type: "error",
          data: "Error while processing audio: " + e 
        });

        this.bypass(inputs, outputs);
      }

      // Now mix
      if (this.mix !== 1.0)
      {
        this.mixAudio(inputs, outputs);
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