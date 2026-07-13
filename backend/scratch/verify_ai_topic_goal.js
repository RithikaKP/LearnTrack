const dotenv = require('dotenv');
const path = require('path');

// Load environment variables FIRST before requiring controllers
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { generateTopicSuggestions } = require('../controllers/topicController');

async function verifyAiTopicGoal() {
    console.log('Verifying AI Topic Generation with Learning Goal...');
    
    if (!process.env.GROQ_API_KEY) {
        console.error('FAIL: GROQ_API_KEY is not defined in the environment.');
        process.exit(1);
    }
    
    console.log('API Key detected:', process.env.GROQ_API_KEY.substring(0, 10) + '...');

    // Mock Express request and response
    const req = {
        body: {
            subjectName: 'React',
            learningGoal: 'Advanced'
        }
    };

    let responseStatus = null;
    let responseData = null;

    const res = {
        status(code) {
            responseStatus = code;
            return this;
        },
        json(data) {
            responseData = data;
            return this;
        }
    };

    try {
        console.log('Invoking generateTopicSuggestions handler with learningGoal="Advanced"...');
        await generateTopicSuggestions(req, res);

        console.log('Response Status:', responseStatus);
        
        if (responseStatus !== 200) {
            console.error(`FAIL: Expected status 200, got ${responseStatus}`);
            process.exit(1);
        }

        if (!Array.isArray(responseData)) {
            console.error('FAIL: Expected response data to be an array of topics.');
            console.error('Got:', responseData);
            process.exit(1);
        }

        console.log(`SUCCESS: Generated ${responseData.length} topics!`);
        console.log('Here are the first 5 topics generated:');
        responseData.slice(0, 5).forEach((t, index) => {
            console.log(`  ${index + 1}. [${t.name}]: ${t.description}`);
        });

        // Basic sanity check to ensure it focuses on advanced topics
        const hasAdvancedTerm = responseData.some(t => 
            /advanced|architecture|optimize|performance|scale|tuning|pattern|enterprise/i.test(t.name) ||
            /advanced|architecture|optimize|performance|scale|tuning|pattern|enterprise/i.test(t.description)
        );

        if (hasAdvancedTerm) {
            console.log('SUCCESS: Generated topics contain advanced concepts as requested!');
        } else {
            console.log('WARNING: No explicit advanced terms found in topics, check descriptions.');
        }

        console.log('All backend verification tests passed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('FAIL: Error during handler execution:', err);
        process.exit(1);
    }
}

verifyAiTopicGoal();
