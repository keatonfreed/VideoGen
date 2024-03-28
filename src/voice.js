const fs = require('fs');
const fetch = require('node-fetch');

const dotenv = require('dotenv').config();


module.exports = async (path, script) => {
    const options = {
        method: 'POST',
        headers: {
            "Accept": "audio/mpeg",
            'Content-Type': 'application/json',
            "xi-api-key": process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
            "model_id": "eleven_monolingual_v1",
            // "text": "And with that... The 2023 season, comes to an end....... Goodnight!",
            "text": script,
            "voice_settings": {
                "similarity_boost": 0.5,
                "stability": 0.5,
                // "style": 123,
                "use_speaker_boost": true
            }
        })
    };

    return await fetch('https://api.elevenlabs.io/v1/text-to-speech/N2lVS1w4EtoT3dr4eOWO', options)
        //let out =  fetch('https://api.elevenlabs.io/v1/text-to-speech/jBpfuIE2acCO8z3wKNLl', options)
        //let out =  fetch('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', options)
        .then(response => {
            if (response.ok) {
                return new Promise((resolve, reject) => {
                    const dest = fs.createWriteStream(path);
                    response.body.pipe(dest);

                    // Listen to the 'finish' event to know when the writing is done.
                    dest.on('finish', () => {
                        resolve(path);
                    });

                    // Listen to the 'error' event to catch any errors during the write process.
                    dest.on('error', (err) => {
                        console.error('Stream Write Error:', err);
                        reject(null);
                    });
                });
            } else {
                console.error('Response was not ok.', response.statusText);
                return null;
            }
        })
        .catch(err => console.error('Fetch error:', err));

}


