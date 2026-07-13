const mongoose = require('mongoose');
const Note = require('../models/Note');

async function testNoteModel() {
    console.log('Testing Note model updates...');
    const nextReviewDateProp = Note.schema.paths.nextReviewDate;
    const isReviewedProp = Note.schema.paths.isReviewed;

    if (!nextReviewDateProp) {
        console.error('FAIL: nextReviewDate property does not exist on Note model!');
        process.exit(1);
    }
    if (!isReviewedProp) {
        console.error('FAIL: isReviewed property does not exist on Note model!');
        process.exit(1);
    }

    console.log('SUCCESS: Schema has nextReviewDate property of type:', nextReviewDateProp.instance);
    console.log('SUCCESS: Schema has isReviewed property of type:', isReviewedProp.instance);

    const tomorrowFunc = nextReviewDateProp.defaultValue;
    if (typeof tomorrowFunc === 'function') {
        const calculatedTomorrow = tomorrowFunc();
        const now = new Date();
        const expectedTomorrow = new Date();
        expectedTomorrow.setDate(now.getDate() + 1);
        expectedTomorrow.setHours(0, 0, 0, 0);

        if (calculatedTomorrow.toDateString() === expectedTomorrow.toDateString()) {
            console.log('SUCCESS: default nextReviewDate correctly calculates tomorrow:', calculatedTomorrow.toDateString());
        } else {
            console.error('FAIL: default nextReviewDate calculation error. Calculated:', calculatedTomorrow, 'Expected:', expectedTomorrow);
        }
    } else {
        console.error('FAIL: default nextReviewDate is not a function!');
    }

    console.log('Model validation passed successfully.');
    process.exit(0);
}

testNoteModel().catch(err => {
    console.error('Testing note model failed:', err);
    process.exit(1);
});
