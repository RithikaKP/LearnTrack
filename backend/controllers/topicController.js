const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const asyncHandler = require('express-async-handler');
const Topic = require('../models/Topic');
const Subject = require('../models/Subject');

const getTopics = asyncHandler(async (req, res) => {
    const topics = await Topic.find({
        subject: req.params.subjectId,
        user: req.user.id
    }).sort({ dayNumber: 1 });

    res.status(200).json(topics);
});
const getTopic = asyncHandler(async (req, res) => {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
        res.status(404);
        throw new Error('Topic not found');
    }

    if (topic.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    res.status(200).json(topic);
});
const createTopic = asyncHandler(async (req, res) => {
    const {
        subjectId,
        name,
        dayNumber,
        resources,
        difficulty,
        notes
    } = req.body;

    if (!subjectId || !name || !dayNumber) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }

    if (subject.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const topic = await Topic.create({
        user: req.user.id,
        subject: subjectId,
        name,
        dayNumber,
        resources: resources || [],
        difficulty: difficulty || 'medium',
        notes: notes || ''
    });

    await Subject.findByIdAndUpdate(subjectId, {
        $inc: { totalTopics: 1 }
    });

    res.status(201).json(topic);
});


const updateTopic = asyncHandler(async (req, res) => {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
        res.status(404);
        throw new Error('Topic not found');
    }

    if (topic.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedTopic = await Topic.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.status(200).json(updatedTopic);
});

const updateTopicStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!status) {
        res.status(400);
        throw new Error('Please provide status');
    }

    const topic = await Topic.findById(req.params.id);

    if (!topic) {
        res.status(404);
        throw new Error('Topic not found');
    }

    if (topic.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const wasCompleted = ['completed', 'mastered'].includes(topic.status);
    const nowCompleted = ['completed', 'mastered'].includes(status);

    topic.status = status;
    if (nowCompleted) {
        topic.completedAt = new Date();
    } else if (!nowCompleted && wasCompleted) {
        topic.completedAt = null;
    }

    await topic.save();

    if (nowCompleted && !wasCompleted) {
        await Subject.findByIdAndUpdate(topic.subject, {
            $inc: { completedTopics: 1 }
        });
    } else if (!nowCompleted && wasCompleted) {
        await Subject.findByIdAndUpdate(topic.subject, {
            $inc: { completedTopics: -1 }
        });
    }

    res.status(200).json(topic);
});

const deleteTopic = asyncHandler(async (req, res) => {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
        res.status(404);
        throw new Error('Topic not found');
    }

    if (topic.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const subjectId = topic.subject;
    const isCompleted = ['completed', 'mastered'].includes(topic.status);

    await topic.deleteOne();

    const updateObj = { $inc: { totalTopics: -1 } };
    if (isCompleted) {
        updateObj.$inc.completedTopics = -1;
    }

    await Subject.findByIdAndUpdate(subjectId, updateObj);

    res.status(200).json({ id: req.params.id });
});

const generateTopicSuggestions = asyncHandler(async (req, res) => {
    const { subjectName, learningGoal } = req.body;
    if (!subjectName) {
        res.status(400);
        throw new Error('Please provide a subject name');
    }
    try {

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            temperature: 0.3,
            response_format: {
                type: "json_object"
            },
            messages: [
                {
                    role: "system",
                    content:
                        "You are an expert software engineer, university curriculum designer, FAANG interviewer, and senior technical mentor."
                },
                {
                    role: "user",
                    content: `
Generate a complete industry-standard roadmap for:

"${subjectName}"

Requirements:

- Generate 25-50 topics.
- Arrange topics in perfect learning order.
- Beginner → Intermediate → Advanced → Expert.
- Include university syllabus topics.
- Include interview topics.
- Include real-world concepts.
- Include architecture.
- Include debugging.
- Include optimization.
- Include deployment.
- Include testing.
- Include best practices.
- Avoid generic topics such as Introduction or Basics.

Return ONLY JSON.

{
  "topics":[
    {
      "name":"",
      "description":""
    }
  ]
}
`
                }
            ]
        });

        const content = completion.choices[0].message.content;

        console.log(content);

        const data = JSON.parse(content);

        return res.status(200).json(data.topics);

    } catch (err) {

        console.error("Groq Error:", err);

    }

    const fallbackData = {
        'react': [
            { name: 'Introduction to React & JSX', description: 'Understand virtual DOM, React components, and JSX syntax' },
            { name: 'Components & Props', description: 'Functional components, class components, and passing props' },
            { name: 'State Management with useState', description: 'Handling component level state and reactivity' },
            { name: 'Side Effects with useEffect', description: 'API fetching, event listeners, and cleanup functions' },
            { name: 'Context API & State Lifting', description: 'Sharing state across multiple child components' },
            { name: 'Handling Forms & Controlled Inputs', description: 'Controlled vs uncontrolled inputs, form submissions' },
            { name: 'Hooks Deep Dive (useMemo & useCallback)', description: 'Optimization techniques and caching functions' },
            { name: 'Custom React Hooks', description: 'Extracting stateful logic into reusable custom hooks' },
            { name: 'React Router & SPA Navigation', description: 'Dynamic routing, URL params, and navigation guards' },
            { name: 'React Performance & Lazy Loading', description: 'Code splitting, Suspense, and optimization tricks' },
            { name: 'React Testing (Jest & React Testing Library)', description: 'Unit testing components and user behavior flows' }
        ],
        'dbms': [
            { name: 'Introduction to Database Systems', description: 'File systems vs DBMS, database architectures' },
            { name: 'Entity-Relationship (ER) Modeling', description: 'Entities, attributes, relationships, and ER diagrams' },
            { name: 'Relational Model & Relational Algebra', description: 'Tables, keys, constraints, and algebraic operations' },
            { name: 'SQL Basics (DDL & DML)', description: 'Creating tables, inserting data, select queries, and filters' },
            { name: 'SQL Joins & Subqueries', description: 'Inner, outer, left, right joins and nested queries' },
            { name: 'Normalization (1NF, 2NF, 3NF, BCNF)', description: 'Anomalies, functional dependencies, and normalizing tables' },
            { name: 'Transaction Management & ACID Properties', description: 'Atomicity, Consistency, Isolation, Durability principles' },
            { name: 'Concurrency Control & Locking', description: 'Schedules, locks, deadlocks, and isolation levels' },
            { name: 'Indexing & Query Optimization', description: 'B-Trees, B+ Trees, hashing, and query plans' },
            { name: 'NoSQL Databases Overview', description: 'Document stores, key-value stores, and database selection' }
        ],
        'operating systems': [
            { name: 'Introduction to Operating Systems', description: 'Kernel, system calls, OS types, and basic architectures' },
            { name: 'Process Management & Threads', description: 'Process control blocks, states, context switching, and multithreading' },
            { name: 'CPU Scheduling Algorithms', description: 'FCFS, SJF, Round Robin, priority scheduling, and queues' },
            { name: 'Process Synchronization', description: 'Critical section problem, semaphores, and monitors' },
            { name: 'Deadlocks', description: 'Characterization, prevention, avoidance (Bankers), and detection' },
            { name: 'Memory Management & Paging', description: 'Logical vs physical address space, fragmentation, paging, and segmentation' },
            { name: 'Virtual Memory & Page Replacement', description: 'Demand paging, FIFO, LRU, Optimal page replacement algorithms' },
            { name: 'File Systems & Storage Structure', description: 'Directory structure, allocation methods, and disk scheduling' },
            { name: 'I/O Systems & Device Drivers', description: 'Interrupts, DMA, buffering, and hardware interfaces' }
        ],
        'dsa': [
            { name: 'Introduction & Time Complexity (Big O)', description: 'Analyzing running times and space complexities' },
            { name: 'Arrays & Strings', description: 'Two pointers, sliding window, and basic matrix operations' },
            { name: 'Linked Lists', description: 'Singly, doubly, and circular linked lists with operations' },
            { name: 'Stacks & Queues', description: 'LIFO & FIFO concepts, queue types, and implementation' },
            { name: 'Recursion & Backtracking', description: 'Base cases, call stack, N-Queens, Sudoku solver' },
            { name: 'Trees & Binary Search Trees (BST)', description: 'Traversals (In/Pre/Post-order, Level-order), BST operations' },
            { name: 'Graphs & Basic Traversals', description: 'BFS, DFS, representation (matrix & adjacency lists)' },
            { name: 'Sorting & Searching Algorithms', description: 'Binary search, merge sort, quick sort, heap sort' },
            { name: 'Heaps & Priority Queues', description: 'Min-heap, max-heap, heapify, and heap applications' },
            { name: 'Dynamic Programming Basics', description: 'Memoization, tabulation, 1D DP, Knapsack problem' },
            { name: 'Hashing & Hash Tables', description: 'Hash functions, collision handling (chaining, probing)' }
        ],
        'java': [
            { name: 'Java Basics & Environment Setup', description: 'JVM, JRE, JDK, java syntax, variables, and basic data types' },
            { name: 'Object-Oriented Programming (OOP) in Java', description: 'Classes, objects, inheritance, polymorphism, encapsulation, and abstraction' },
            { name: 'Java Strings & Arrays', description: 'String pool, StringBuilder, multidimensional arrays' },
            { name: 'Exception Handling in Java', description: 'Try-catch blocks, throw, throws, finally, custom exceptions' },
            { name: 'Java Collections Framework', description: 'List, Set, Map, ArrayList, HashMap, and Iterators' },
            { name: 'Generics & Lambda Expressions', description: 'Type safety, generic classes, functional interfaces' },
            { name: 'Java Multithreading & Concurrency', description: 'Creating threads, synchronization, Runnable, ExecutorService' },
            { name: 'Java File I/O & Streams API', description: 'Reading/writing files, stream filters, maps, and collectors' },
            { name: 'JDBC & Database Connections', description: 'Connecting to databases, statements, ResultSet' }
        ],
        'system design': [
            { name: 'Introduction to System Design & Scale', description: 'Vertical vs horizontal scaling, latency vs throughput metrics' },
            { name: 'Load Balancers & Reverse Proxies', description: 'Nginx, HAProxy, load balancing algorithms, round-robin, hash-based' },
            { name: 'Caching Strategies', description: 'Redis, Memcached, eviction policies (LRU, LFU), write-through/write-back' },
            { name: 'Database Scaling & Sharding', description: 'Replication, partition keys, consistent hashing, master-slave systems' },
            { name: 'Message Queues & Event-Driven Architecture', description: 'Kafka, RabbitMQ, pub-sub systems, asynchronous processing' },
            { name: 'Microservices & API Gateways', description: 'Service discovery, circuit breakers, rate limiting, and routing' },
            { name: 'CDN & Content Delivery Networks', description: 'Caching static assets globally, edge computing, geo-routing' },
            { name: 'Designing a Rate Limiter', description: 'Token bucket, leaking bucket, sliding window algorithms' },
            { name: 'Designing a URL Shortener (TinyURL)', description: 'API endpoints, database selection, hashing algorithms, collision resolution' },
            { name: 'System Security & High Availability', description: 'DDoS mitigation, encryption, single point of failure (SPOF) elimination' }
        ],
        'aws': [
            { name: 'AWS Global Infrastructure & IAM', description: 'Regions, Availability Zones, users, groups, roles, and security policies' },
            { name: 'Amazon Elastic Compute Cloud (EC2)', description: 'Instances, security groups, AMIs, storage volumes (EBS), and pricing models' },
            { name: 'Amazon Simple Storage Service (S3)', description: 'Buckets, objects, access control list, storage classes, and lifecycle policies' },
            { name: 'AWS Networking (VPC)', description: 'Subnets, route tables, internet gateways, NAT gateways, and security controls' },
            { name: 'Database Services (RDS & DynamoDB)', description: 'Relational database scaling (RDS) vs NoSQL document-based scaling (DynamoDB)' },
            { name: 'Serverless Architecture (Lambda & API Gateway)', description: 'Event-driven serverless functions and REST/HTTP API routing configurations' },
            { name: 'AWS Load Balancing & Auto Scaling', description: 'ELB, ALB, scaling policies, and high-availability setups' },
            { name: 'AWS Monitoring (CloudWatch & CloudTrail)', description: 'Metrics, alarms, logging, API auditing, and resource tracking' },
            { name: 'Infrastructure as Code (CloudFormation & Terraform)', description: 'Automating infrastructure deployments using templates' }
        ],
        'machine learning': [
            { name: 'Introduction to ML & Mathematical Foundations', description: 'Linear algebra, probability, calculus, supervised vs unsupervised learning' },
            { name: 'Data Preprocessing & Feature Engineering', description: 'Handling missing data, normalization, scaling, and encoding categorical values' },
            { name: 'Linear & Logistic Regression', description: 'Cost functions, gradient descent, binary classification, evaluation metrics' },
            { name: 'Decision Trees & Random Forests', description: 'Information gain, Gini impurity, ensemble learning, and bagging methods' },
            { name: 'Support Vector Machines (SVM)', description: 'Hyperplanes, margins, support vectors, and the kernel trick' },
            { name: 'Clustering Algorithms (K-Means & Hierarchical)', description: 'Centroids, inertia, elbow method, and dendrogram structures' },
            { name: 'Dimensionality Reduction (PCA)', description: 'Principal Component Analysis, variance ratio, eigenvalues, eigenvectors' },
            { name: 'Neural Networks & Deep Learning Basics', description: 'Perceptrons, activation functions, backpropagation, and dense layers' },
            { name: 'Model Evaluation & Hyperparameter Tuning', description: 'Cross-validation, bias-variance tradeoff, grid search, random search' },
            { name: 'Introduction to NLP & Computer Vision', description: 'TF-IDF, word embeddings, image filters, and basic CNN concepts' }
        ]
    };

    const queryNormalized = subjectName.toLowerCase().trim();
    let result = null;

    for (const key of Object.keys(fallbackData)) {
        if (queryNormalized.includes(key) || key.includes(queryNormalized)) {
            result = fallbackData[key];
            break;
        }
    }

    if (!result) {
        result = [
            { name: `Introduction to ${subjectName}`, description: `Foundational concepts, history, and core components of ${subjectName}.` },
            { name: `Core Principles of ${subjectName}`, description: `Key architectural paradigms, syntax rules, or core philosophies.` },
            { name: `Environment Setup & Configuration`, description: `Setting up local work environments, tools, and initial projects.` },
            { name: `Essential Workflow & Operations`, description: `Basic commands, daily tasks, or essential functions of ${subjectName}.` },
            { name: `Intermediate Concepts & Patterns`, description: `Advanced structuring, state flows, or reusable code paradigms.` },
            { name: `Handling Edge Cases & Errors`, description: `Exceptions, validation systems, and troubleshooting workflows.` },
            { name: `Performance & Optimization`, description: `Enhancing execution speed, scalability, and minimizing resource usage.` },
            { name: `Testing & Quality Assurance`, description: `Writing unit tests, validating integrations, and debugging bugs.` },
            { name: `Best Practices & Security`, description: `Standard industry specifications, code aesthetics, and secure configurations.` },
            { name: `Project Implementation & Review`, description: `Consolidating learning with a capstone exercise or review session.` }
        ];
    }

    res.status(200).json(result);
});

module.exports = {
    getTopics,
    getTopic,
    createTopic,
    updateTopic,
    updateTopicStatus,
    deleteTopic,
    generateTopicSuggestions
};
