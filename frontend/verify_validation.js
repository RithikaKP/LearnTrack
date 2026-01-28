const validationLogic = (topics, dailyTarget) => {
    // 1. Group topics by Day Number
    const topicsByDay = topics.reduce((acc, topic) => {
        const day = topic.dayNumber;
        if (!acc[day]) acc[day] = 0;
        acc[day]++;
        return acc;
    }, {});

    // 2. Find the "Latest" active day (max day)
    const topicDays = Object.keys(topicsByDay).map(Number);
    const maxDay = topicDays.length > 0 ? Math.max(...topicDays) : 1;

    // 3. Count for that day
    const currentCount = topicsByDay[maxDay] || 0;
    const isComplete = currentCount >= dailyTarget;
    const missing = dailyTarget - currentCount;

    return { maxDay, currentCount, dailyTarget, isComplete, missing };
}

// Test Case 1: User has 3 topics for Day 1. Target 4.
const testTopics1 = [
    { name: 't1', dayNumber: 1 },
    { name: 't2', dayNumber: 1 },
    { name: 't3', dayNumber: 1 }
];
const result1 = validationLogic(testTopics1, 4);
console.log("Test 1 (3/4 Topics):", result1);

// Test Case 2: User adds 4th topic.
const testTopics2 = [
    ...testTopics1,
    { name: 't4', dayNumber: 1 }
];
const result2 = validationLogic(testTopics2, 4);
console.log("Test 2 (4/4 Topics):", result2);

// Test Case 3: User starts Day 2 with 1 topic
const testTopics3 = [
    ...testTopics2,
    { name: 'd2t1', dayNumber: 2 }
];
const result3 = validationLogic(testTopics3, 4);
console.log("Test 3 (1/4 Topics on Day 2):", result3);
