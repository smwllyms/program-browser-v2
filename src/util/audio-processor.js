export default (()=> `
class MyAudioProcessor extends AudioWorkletProcessor {
    constructor() {
      super();

      // Setup init data
      this.runtimeData = {};
      this.runtimeData.functions = {};
      this.runtimeData.globals = {};

      this.port.onmessage = event => {
        const { type, data } = event.data;
        console.log(type)
        if (type === "update")
        {
          this.codeData = JSON.parse(data.codeData);
          this.updateCodeData();
        }
      };
    }
   
    updateCodeData() {

      this.runtimeData.functions = {};

      for (const f of Object.keys(this.codeData.functions))
      {
        if (f !== "__init")
        {
          const funcData = this.codeData.functions[f];
          this.runtimeData.functions[f] = new Function(...funcData.parameters, "__functions", "__globals", funcData.body);  
        }
      }

      // Run init to initialize Globals
      this.runtimeData.globals = {};
      this.runtimeData.functions.__init = new Function("__globals", this.codeData.functions.__init.body);
      this.runtimeData.functions.__init(this.runtimeData.globals);
    }

    processAudio(inputs, outputs) {

      if (!this.runtimeData.functions.processAudio) {
        return true;
      }

      this.runtimeData.functions.processAudio(inputs, outputs, this.runtimeData.functions, this.runtimeData.globals);
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