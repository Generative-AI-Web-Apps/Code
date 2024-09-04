import redis from "redis";
import { promisify } from "util";
import { generateText } from "ai";

// Create a Redis client
const client = redis.createClient();
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

// PlantUML Prompt Library Class
class PlantUMLPromptLibrary {
  constructor() {
    this.cache = new Map();
  }

  async createPrompt(entry) {
    const id = `plantuml:${entry.name}:${entry.version}`;
    const now = new Date().toISOString();
    const promptEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await setAsync(id, JSON.stringify(promptEntry));
    return id;
  }

  async getPrompt(name, version) {
    const cacheKey = `${name}:${version}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const id = `plantuml:${name}:${version}`;
    const promptJson = await getAsync(id);
    if (!promptJson) return null;

    const promptEntry = JSON.parse(promptJson);
    const promptTemplate = {
      template: promptEntry.template,
      inputVariables: promptEntry.inputVariables,
    };

    this.cache.set(cacheKey, promptTemplate);
    return promptTemplate;
  }

  async generatePlantUML(name, version, input) {
    const prompt = await this.getPrompt(name, version);
    if (!prompt) throw new Error(`Prompt ${name}:${version} not found`);

    const generatedPrompt = prompt.template.replace('{input}', input);

    // Call the OpenAI provider using the generateText function
    const { text } = await generateText({
      model: openai("gpt-4-turbo"), // Specify the model to use
      prompt: generatedPrompt, // Use the generated prompt
    });

    return text; // Return the generated text from the AI model
  }
}

// Initialize the library
const plantUMLPromptLibrary = new PlantUMLPromptLibrary();

// Example 1: Class Diagram
plantUMLPromptLibrary.createPrompt({
  name: "classdiagram",
  version: "1.0.0",
  template: `Generate a PlantUML Class Diagram based on the following description. Include classes, attributes, methods, and relationships. Use appropriate PlantUML syntax.

Description:
{input}

PlantUML Class Diagram:
@startuml
' Your generated PlantUML code here
@enduml`,
  inputVariables: ["input"],
  diagramType: "class",
  description: "Generates a PlantUML Class Diagram from a text description",
});

// Example 2: Activity Diagram
plantUMLPromptLibrary.createPrompt({
  name: "activitydiagram",
  version: "1.0.0",
  template: `Generate a PlantUML Activity Diagram based on the following process description. Include start/end points, activities, decision points, and flow directions. Use appropriate PlantUML syntax.

Process Description:
{input}

PlantUML Activity Diagram:
@startuml
' Your generated PlantUML code here
@enduml`,
  inputVariables: ["input"],
  diagramType: "activity",
  description:
    "Generates a PlantUML Activity Diagram from a process description",
});

// Usage examples
async function generateClassDiagram(description) {
  return plantUMLPromptLibrary.generatePlantUML(
    "classdiagram",
    "1.0.0",
    description
  );
}

async function generateActivityDiagram(processDescription) {
  return plantUMLPromptLibrary.generatePlantUML(
    "activitydiagram",
    "1.0.0",
    processDescription
  );
}

// Example executions
(async () => {
  const classDiagramPrompt = await generateClassDiagram(
    "Create a class diagram for a library system with Book, Author, and Library classes. Books have titles and ISBNs. Authors have names. Libraries can contain multiple books."
  );
  console.log("Class Diagram Prompt:", classDiagramPrompt);

  const activityDiagramPrompt = await generateActivityDiagram(
    "Describe the process of ordering a book online: Customer browses catalog, selects a book, adds to cart, proceeds to checkout, enters shipping info, makes payment, and receives order confirmation."
  );
  console.log("Activity Diagram Prompt:", activityDiagramPrompt);
})();
