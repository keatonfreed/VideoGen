const dotenv = require('dotenv').config();
const OpenAI = require("openai");


let OPENAI_KEY = process.env.OPENAI_API_KEY
const openai = new OpenAI({
    apiKey: OPENAI_KEY
});


// const context = [
//     {
//         "role": "system",
//         "content": "You're tasked with creating content for ByteScripts, a YouTube shorts channel that produces automated videos featuring code with AI narration. Your role involves generating concise, engaging video segments that visually present code while an AI voice explains it.\n\nEnsure strict adherence to all provided guidelines, considering every detail in your response. Your output should cater to the channel's format: short, impactful videos that effectively communicate coding concepts, errors, or tips to a diverse audience.\n\nYour responsibilities include selecting coding topics that are suitable for brief exposition, scripting clear and concise explanations, and formatting code to be both visually appealing and easily understandable on screen. The narration must be designed for clarity and brevity, given the short format of YouTube shorts, and should complement the visual code presentation, enhancing viewer comprehension and engagement.\n\nRemember, the essence of ByteScripts is to demystify coding for viewers in a highly accessible and engaging way, leveraging the power of visual learning and AI technology. Your creative input and attention to detail are crucial in achieving this goal."
//     },
//     {
//         "role": "user",
//         "content": "Your task is to create a JSON object as your response with no preceding or ending text, the response should begin with \"{\", end with \"}\", and contain exactly five properties: \"Idea\", \"CorrectCode\", \"BugIdea\", \"Code\", and \"Script\". Ensure there's no text before or after the JSON object, and avoid wrapping it in any form of markup like ```json. The response must be fully compatible with JSON.parse(), with all quotes inside properly escaped.\n\nSpecifications:\n\nIdea: Describe the basic coding problem, focusing on the task without reference to potential bugs.\n\nCorrectCode: Provide JavaScript code that solves the problem:\n-The code should be readable, well-formatted, and span between 5 to 20 lines, embodying complexity in ideas and potential bugs.\n- Ensure the task and solution are complex enough to challenge but clear to understand.\n- Use no comments in the code\n- Not too simple that the bugs are forced to be just random spelling mistakes\n- Should consider not using built in JS functions but creating custom ones to add challenge to understanding the task, and more importantly adding room for errors in calculation or logic.\n\nBugIdea: It is a string, but with text inside listing the first list 10 potential conceptual or logical bugs to introduce into the \"CorrectCode,\", make sure they are all mostly different and study different challenges and concepts with the code. Then select the most challenging and interesting bug that is not a simple mistake but a nuanced issue requiring deep analysis to spot. This bug should significantly increase the problem's complexity. After the list, add a decision of the best bug based on making the challenge complex and interesting.\n\nCode: Repeat the \"CorrectCode\" but with the selected bug incorporated, maintaining proper formatting.\n\nScript: Craft a short narration script explaining the bug's impact, avoiding technical jargon to keep the explanation accessible. It should be pretty short, max of around 10 seconds talk time, but also make sure to exlplain where the problem is\n\nImportant Considerations:\n\nChallenges should be non-obvious, focusing on logical or conceptual errors rather than simple mistakes, encouraging thorough analysis.\nExamples for Reference:\n\nInfinite Loop in Class Setters:\n\nIdea: \"Create a class representing a person with name and age properties.\"\nCorrectCode: \"class Person{\\n constructor(name, age) {\\n this._name = name;\\n this._age = age;\\n }\\n set name(value) {\\n this._name = value;\\n }\\n set age(value) {\\n this._age = value;\\n }\\n}\"\nBugIdea: \"...(10 other ideas before this response, not in the example but you must list 10 possible creative good bug ideas), Introduce a bug through self-referential setter calls causing an infinite loop. After the above 10 more challenging bug ideas, this one was selected for its subtlety and the depth of understanding required to identify it.\"\nCode: \"class Person{\\n constructor(name, age) {\\n this.name = name;\\n this.age = age;\\n }\\n set name(value) {\\n this.name = value;\\n }\\n set age(value) {\\n this.age = value;\\n }\\n}\"\nScript: \"The bug is a self-referential call in the setters, causing an infinite loop when trying to assign values through the constructor.\"\nProduct Calculation Error:\n\nIdea: \"Write a function that calculates the product of numbers in an array.\"\nCorrectCode: \"function calculateProduct(numbers) {\\n let product = 1;\\n for (let num of numbers) {\\n product *= num;\\n }\\n return product;\\n}\"\nBugIdea: \"...(10 other ideas before this response, not in the example but you must list 10 possible creative good bug ideas), Embed a bug where the product calculation starts with the wrong initial value. Among the 10 considered bug ideas, this one was chosen for its ability to fundamentally challenge the user's understanding of initial conditions in loops.\"\nCode: \"function calculateProduct(numbers) {\\n let product = 0;\\n for (let num of numbers) {\\n product *= num;\\n }\\n return product;\\n}\"\nScript: \"The code erroneously initializes the product variable to 0, which undermines the multiplication, making the final product always 0 regardless of the input.\"\n\nThese examples serve to illustrate how even simple coding tasks can be complicated by subtle, logical bugs, encouraging users to engage more deeply with the code to find and understand the error."
//     } 
// ]
const ideaPrompt = [
    {
        "role": "system",
        "content": ""
    },
    {
        "role": "user",
        "content": ""
    }
]
const bugPrompt = [
    {
        "role": "system",
        "content": ""
    },
    {
        "role": "user",
        "content": ""
    }
]
const speechPrompt = [
    {
        "role": "system",
        "content": ""
    },
    {
        "role": "user",
        "content": ""
    }
]


module.exports = async () => {
    await rawAI()
}

async function rawAI(prompt, json = true) {
    const completion = await openai.chat.completions.create({
        messages: prompt,
        model: "gpt-4-turbo-preview",
        temperature: 1.1,
        max_tokens: 1000,
    });
    let aiResp = completion.choices[0].message.content
    if (json) {
        let parsedResp
        try {
            parsedResp = JSON.parse(aiResp)
        } catch (e) {
            return null
        }
        return parsedResp
    } else {
        return aiResp
    }
}