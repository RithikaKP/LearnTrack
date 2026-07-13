const PROBLEMS_CATALOG = [
    {
        problemId: 'lc-1',
        title: 'Two Sum',
        platform: 'LeetCode',
        difficulty: 'Easy',
        category: 'Array',
        tags: ['Array', 'Hash Table'],
        url: 'https://leetcode.com/problems/two-sum'
    },
    {
        problemId: 'lc-167',
        title: 'Two Sum II - Input Array Is Sorted',
        platform: 'LeetCode',
        difficulty: 'Medium',
        category: 'Array',
        tags: ['Array', 'Two Pointers', 'Binary Search'],
        url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted'
    },
    {
        problemId: 'lc-1214',
        title: 'Two Sum BSTs',
        platform: 'LeetCode',
        difficulty: 'Easy',
        category: 'Tree',
        tags: ['Tree', 'Binary Search Tree', 'Two Pointers'],
        url: 'https://leetcode.com/problems/two-sum-bsts'
    },
    {
        problemId: 'lc-1099',
        title: 'Two Sum Less Than K',
        platform: 'LeetCode',
        difficulty: 'Easy',
        category: 'Array',
        tags: ['Array', 'Two Pointers', 'Sorting'],
        url: 'https://leetcode.com/problems/two-sum-less-than-k'
    },

    {
        problemId: 'lc-56',
        title: 'Merge Intervals',
        platform: 'LeetCode',
        difficulty: 'Medium',
        category: 'Array',
        tags: ['Array', 'Sorting'],
        url: 'https://leetcode.com/problems/merge-intervals'
    },
    {
        problemId: 'lc-88',
        title: 'Merge Sorted Array',
        platform: 'LeetCode',
        difficulty: 'Easy',
        category: 'Array',
        tags: ['Array', 'Two Pointers', 'Sorting'],
        url: 'https://leetcode.com/problems/merge-sorted-array'
    },
    {
        problemId: 'lc-23',
        title: 'Merge k Sorted Lists',
        platform: 'LeetCode',
        difficulty: 'Hard',
        category: 'Linked List',
        tags: ['Linked List', 'Divide and Conquer', 'Heap'],
        url: 'https://leetcode.com/problems/merge-k-sorted-lists'
    },

    {
        problemId: 'lc-146',
        title: 'LRU Cache',
        platform: 'LeetCode',
        difficulty: 'Medium',
        category: 'Design',
        tags: ['Design', 'Hash Table', 'Linked List'],
        url: 'https://leetcode.com/problems/lru-cache'
    },
    {
        problemId: 'lc-206',
        title: 'Reverse Linked List',
        platform: 'LeetCode',
        difficulty: 'Easy',
        category: 'Linked List',
        tags: ['Linked List', 'Recursion'],
        url: 'https://leetcode.com/problems/reverse-linked-list'
    },
    {
        problemId: 'lc-4',
        title: 'Median of Two Sorted Arrays',
        platform: 'LeetCode',
        difficulty: 'Hard',
        category: 'Array',
        tags: ['Array', 'Binary Search', 'Divide and Conquer'],
        url: 'https://leetcode.com/problems/median-of-two-sorted-arrays'
    },
    {
        problemId: 'lc-3',
        title: 'Longest Substring Without Repeating Characters',
        platform: 'LeetCode',
        difficulty: 'Medium',
        category: 'String',
        tags: ['String', 'Hash Table', 'Sliding Window'],
        url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters'
    },
    {
        problemId: 'lc-200',
        title: 'Number of Islands',
        platform: 'LeetCode',
        difficulty: 'Medium',
        category: 'Graph',
        tags: ['Graph', 'BFS', 'DFS'],
        url: 'https://leetcode.com/problems/number-of-islands'
    },
    {
        problemId: 'lc-70',
        title: 'Climbing Stairs',
        platform: 'LeetCode',
        difficulty: 'Easy',
        category: 'DP',
        tags: ['Math', 'DP', 'Memoization'],
        url: 'https://leetcode.com/problems/climbing-stairs'
    },

    {
        problemId: 'cf-4a',
        title: 'Watermelon',
        platform: 'Codeforces',
        difficulty: 'Easy',
        category: 'Math',
        tags: ['Math', 'Greedy'],
        url: 'https://codeforces.com/problemset/problem/4/A'
    },
    {
        problemId: 'cf-71a',
        title: 'Way Too Long Words',
        platform: 'Codeforces',
        difficulty: 'Easy',
        category: 'String',
        tags: ['String'],
        url: 'https://codeforces.com/problemset/problem/71/A'
    },
    {
        problemId: 'cf-1a',
        title: 'Theatre Square',
        platform: 'Codeforces',
        difficulty: 'Medium',
        category: 'Math',
        tags: ['Math'],
        url: 'https://codeforces.com/problemset/problem/1/A'
    },
    {
        problemId: 'cf-158a',
        title: 'Next Round',
        platform: 'Codeforces',
        difficulty: 'Easy',
        category: 'Array',
        tags: ['Array', 'Sorting'],
        url: 'https://codeforces.com/problemset/problem/158/A'
    },
    {
        problemId: 'cf-282a',
        title: 'Bit++',
        platform: 'Codeforces',
        difficulty: 'Easy',
        category: 'Math',
        tags: ['Math'],
        url: 'https://codeforces.com/problemset/problem/282/A'
    },
    {
        problemId: 'cf-112a',
        title: 'Petya and Strings',
        platform: 'Codeforces',
        difficulty: 'Easy',
        category: 'String',
        tags: ['String'],
        url: 'https://codeforces.com/problemset/problem/112/A'
    },

    {
        problemId: 'cc-cbs',
        title: 'Chef and Brain Speed',
        platform: 'CodeChef',
        difficulty: 'Easy',
        category: 'Math',
        tags: ['Math'],
        url: 'https://www.codechef.com/problems/CBS'
    },
    {
        problemId: 'cc-chefandcandy',
        title: 'Chef and Candy',
        platform: 'CodeChef',
        difficulty: 'Easy',
        category: 'Math',
        tags: ['Math'],
        url: 'https://www.codechef.com/problems/CHEFcandies'
    },
    {
        problemId: 'cc-chefnextgen',
        title: 'Chef and NextGen',
        platform: 'CodeChef',
        difficulty: 'Easy',
        category: 'Math',
        tags: ['Math'],
        url: 'https://www.codechef.com/problems/HELIUM3'
    },
    {
        problemId: 'cc-flow001',
        title: 'Add Two Numbers',
        platform: 'CodeChef',
        difficulty: 'Easy',
        category: 'Math',
        tags: ['Math'],
        url: 'https://www.codechef.com/problems/FLOW001'
    },
    {
        problemId: 'cc-atm',
        title: 'ATM Machine',
        platform: 'CodeChef',
        difficulty: 'Easy',
        category: 'Array',
        tags: ['Array'],
        url: 'https://www.codechef.com/problems/ATM2'
    },

    {
        problemId: 'hr-solve-me-first',
        title: 'Solve Me First',
        platform: 'HackerRank',
        difficulty: 'Easy',
        category: 'Math',
        tags: ['Math'],
        url: 'https://www.hackerrank.com/challenges/solve-me-first'
    },
    {
        problemId: 'hr-simple-array-sum',
        title: 'Simple Array Sum',
        platform: 'HackerRank',
        difficulty: 'Easy',
        category: 'Array',
        tags: ['Array'],
        url: 'https://www.hackerrank.com/challenges/simple-array-sum'
    },
    {
        problemId: 'hr-compare-triplets',
        title: 'Compare the Triplets',
        platform: 'HackerRank',
        difficulty: 'Easy',
        category: 'Array',
        tags: ['Array'],
        url: 'https://www.hackerrank.com/challenges/compare-the-triplets'
    },
    {
        problemId: 'hr-plus-minus',
        title: 'Plus Minus',
        platform: 'HackerRank',
        difficulty: 'Easy',
        category: 'Math',
        tags: ['Math'],
        url: 'https://www.hackerrank.com/challenges/plus-minus'
    },
    {
        problemId: 'hr-staircase',
        title: 'Staircase',
        platform: 'HackerRank',
        difficulty: 'Easy',
        category: 'Math',
        tags: ['Math'],
        url: 'https://www.hackerrank.com/challenges/staircase'
    },

    {
        problemId: 'ac-abc086a',
        title: 'Product',
        platform: 'AtCoder',
        difficulty: 'Easy',
        category: 'Math',
        tags: ['Math'],
        url: 'https://atcoder.jp/contests/abs/tasks/abc086_a'
    },
    {
        problemId: 'ac-abc081a',
        title: 'Placing Marbles',
        platform: 'AtCoder',
        difficulty: 'Easy',
        category: 'String',
        tags: ['String'],
        url: 'https://atcoder.jp/contests/abs/tasks/abc081_a'
    },
    {
        problemId: 'ac-abc081b',
        title: 'Shift Only',
        platform: 'AtCoder',
        difficulty: 'Easy',
        category: 'Math',
        tags: ['Math'],
        url: 'https://atcoder.jp/contests/abs/tasks/abc081_b'
    },
    {
        problemId: 'ac-abc087b',
        title: 'Coins',
        platform: 'AtCoder',
        difficulty: 'Easy',
        category: 'Math',
        tags: ['Math'],
        url: 'https://atcoder.jp/contests/abs/tasks/abc087_b'
    },
    {
        problemId: 'ac-abc083b',
        title: 'Some Sums',
        platform: 'AtCoder',
        difficulty: 'Easy',
        category: 'Math',
        tags: ['Math'],
        url: 'https://atcoder.jp/contests/abs/tasks/abc083_b'
    },

    {
        problemId: 'gfg-missing',
        title: 'Missing Number in Array',
        platform: 'GeeksforGeeks',
        difficulty: 'Easy',
        category: 'Array',
        tags: ['Array'],
        url: 'https://practice.geeksforgeeks.org/problems/missing-number-in-array1416/1'
    },
    {
        problemId: 'gfg-subarray',
        title: 'Subarray with Given Sum',
        platform: 'GeeksforGeeks',
        difficulty: 'Medium',
        category: 'Array',
        tags: ['Array', 'Sliding Window'],
        url: 'https://practice.geeksforgeeks.org/problems/subarray-with-given-sum-1587115621/1'
    },
    {
        problemId: 'gfg-kadane',
        title: "Kadane's Algorithm",
        platform: 'GeeksforGeeks',
        difficulty: 'Medium',
        category: 'Array',
        tags: ['Array', 'DP'],
        url: 'https://practice.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1'
    },
    {
        problemId: 'gfg-leader',
        title: 'Leaders in an Array',
        platform: 'GeeksforGeeks',
        difficulty: 'Easy',
        category: 'Array',
        tags: ['Array'],
        url: 'https://practice.geeksforgeeks.org/problems/leaders-in-an-array-1587115620/1'
    },
    {
        problemId: 'gfg-sort012',
        title: 'Sort an Array of 0s, 1s and 2s',
        platform: 'GeeksforGeeks',
        difficulty: 'Easy',
        category: 'Sorting',
        tags: ['Array', 'Sorting'],
        url: 'https://practice.geeksforgeeks.org/problems/sort-an-array-of-0s-1s-and-2s4231/1'
    }
];

module.exports = PROBLEMS_CATALOG;
