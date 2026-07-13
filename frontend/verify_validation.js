const validationLogic = (topics, dailyTarget) => {
    const topicsByDay = topics.reduce((acc, topic) => {
        const day = topic.dayNumber;
        if (!acc[day]) acc[day] = 0;
        acc[day]++;
        return acc;
    }, {});

    const topicDays = Object.keys(topicsByDay).map(Number);
    const maxDay = topicDays.length > 0 ? Math.max(...topicDays) : 1;

    const currentCount = topicsByDay[maxDay] || 0;
    const isComplete = currentCount >= dailyTarget;
    const missing = dailyTarget - currentCount;

    return { maxDay, currentCount, dailyTarget, isComplete, missing };
}

const testTopics1 = [
    { name: 't1', dayNumber: 1 },
    { name: 't2', dayNumber: 1 },
    { name: 't3', dayNumber: 1 }
];
const result1 = validationLogic(testTopics1, 4);
console.log("Test 1 (3/4 Topics):", result1);

const testTopics2 = [
    ...testTopics1,
    { name: 't4', dayNumber: 1 }
];
const result2 = validationLogic(testTopics2, 4);
console.log("Test 2 (4/4 Topics):", result2);

const testTopics3 = [
    ...testTopics2,
    { name: 'd2t1', dayNumber: 2 }
];
const result3 = validationLogic(testTopics3, 4);
console.log("Test 3 (1/4 Topics on Day 2):", result3);
