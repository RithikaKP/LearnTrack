async function test() {
    try {
        console.log('Attempting login...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'demo@example.com',
                password: 'password'
            })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
            console.error('Login failed:', loginData);
            return;
        }
        const token = loginData.token;
        console.log('Login successful, token acquired.');

        console.log('Connecting to AtCoder...');
        const connectRes = await fetch('http://localhost:5000/api/problems/platforms/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                platform: 'AtCoder',
                username: 'coder'
            })
        });
        const text = await connectRes.text();
        console.log('Response Status:', connectRes.status);
        console.log('Response Text:', text.slice(0, 1000));
    } catch (err) {
        console.error('API Test Error:', err.message);
    }
}

test();
