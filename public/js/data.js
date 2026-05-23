// Summer Study Hub — Data Module
// Extracted from checklist.html and summer_schedule.html

const START_DATE = new Date(2026, 4, 24); // May 24, 2026 (month is 0-indexed)
const END_DATE = new Date(2026, 6, 5);    // July 5, 2026
const TOTAL_DAYS = 42;

const CHECKLIST_DATA = {
  dsa: [
    // ═══════════════════════════════════════
    // WEEK 1 DSA — May 24 – May 30
    // ═══════════════════════════════════════
    {
      week: 1,
      dates: "May 24 – May 30",
      units: [
        {
          title: "Unit 1 — C++ Foundation",
          items: [
            { id: "dsa-1-1", text: "Set up C++ environment (VS Code + g++ or online IDE)", tags: [] },
            { id: "dsa-1-2", text: "Variables, data types (int, long long, float, char, bool), I/O with cin/cout", tags: [] },
            { id: "dsa-1-3", text: "Control flow: if-else, switch, nested conditions", tags: [] },
            { id: "dsa-1-4", text: "Loops: for, while, do-while. Print patterns (star pyramid)", tags: [] },
            { id: "dsa-1-5", text: "Functions: declaration, definition, return types", tags: [] },
            { id: "dsa-1-6", text: "Pass by value vs pass by reference (&) — write 3 examples each", tags: ["critical"] },
            { id: "dsa-1-7", text: "Pointers: declaration, dereferencing (*), address-of (&), pointer arithmetic", tags: [] },
            { id: "dsa-1-8", text: "Big O notation: O(1), O(N), O(N²), O(log N) — analyze your own loops", tags: [] }
          ]
        },
        {
          title: "Unit 2 — STL",
          items: [
            { id: "dsa-1-9", text: "std::vector — push_back, pop_back, size, at, iterate with for loop & auto", tags: [] },
            { id: "dsa-1-10", text: "std::map and std::unordered_map — insert, find, iterate, count", tags: [] },
            { id: "dsa-1-11", text: "std::set and std::unordered_set — insert, erase, find", tags: [] },
            { id: "dsa-1-12", text: "std::stack and std::queue — push, pop, top/front, empty", tags: [] },
            { id: "dsa-1-13", text: "std::priority_queue — max-heap by default, min-heap with custom comparator", tags: [] },
            { id: "dsa-1-14", text: "std::sort with custom comparator lambda. std::lower_bound and upper_bound", tags: [] },
            { id: "dsa-1-15", text: "std::next_permutation. Practice: find all permutations of [1,2,3]", tags: [] },
            { id: "dsa-1-16", text: "LeetCode: Two Sum (use unordered_map)", tags: ["lc", "LC #1"] }
          ]
        }
      ]
    },

    // ═══════════════════════════════════════
    // WEEK 2 DSA — May 31 – June 6
    // ═══════════════════════════════════════
    {
      week: 2,
      dates: "May 31 – June 6",
      units: [
        {
          title: "Unit 3 — Maths & Recursion",
          items: [
            { id: "dsa-2-1", text: "Digit extraction: count digits, reverse a number, check palindrome number", tags: [] },
            { id: "dsa-2-2", text: "GCD using Euclidean algorithm (recursive). LCM = a*b/GCD", tags: [] },
            { id: "dsa-2-3", text: "Check prime (trial division O(√N)). Count primes up to N.", tags: [] },
            { id: "dsa-2-4", text: "Sieve of Eratosthenes — implement for primes up to 10^6", tags: ["critical"] },
            { id: "dsa-2-5", text: "Recursion basics: print 1 to N, print N to 1, sum of N numbers — draw call stack on paper", tags: [] },
            { id: "dsa-2-6", text: "Recursion: factorial, fibonacci (understand the tree), power(x, n)", tags: [] },
            { id: "dsa-2-7", text: "Reverse array using recursion. Check palindrome string using recursion.", tags: [] },
            { id: "dsa-2-8", text: "Multiple recursion calls: understand branching. Print all subsequences of array.", tags: ["critical"] },
            { id: "dsa-2-9", text: "LeetCode: Climbing Stairs", tags: ["lc", "LC #70"] },
            { id: "dsa-2-10", text: "LeetCode: Pow(x, n)", tags: ["lc", "LC #50"] },
            { id: "dsa-2-11", text: "REVISION DAY: Redo all recursion problems blind. No notes, no help.", tags: [] }
          ]
        }
      ]
    },

    // ═══════════════════════════════════════
    // WEEK 3 DSA — June 7 – June 13
    // ═══════════════════════════════════════
    {
      week: 3,
      dates: "June 7 – June 13",
      units: [
        {
          title: "Unit 4 — Arrays Easy & Medium",
          items: [
            { id: "dsa-3-1", text: "Largest element in array. Second largest (without sorting).", tags: [] },
            { id: "dsa-3-2", text: "Check if array is sorted. Remove duplicates from sorted array.", tags: ["lc", "LC #26"] },
            { id: "dsa-3-3", text: "Left rotate array by 1. Left/right rotate by K positions.", tags: [] },
            { id: "dsa-3-4", text: "Move zeroes to end. Union and intersection of two sorted arrays.", tags: [] },
            { id: "dsa-3-5", text: "Linear search. Missing number (XOR trick).", tags: ["lc", "LC #268"] },
            { id: "dsa-3-6", text: "Two Sum (brute + hash map solution).", tags: ["lc", "LC #1"] },
            { id: "dsa-3-7", text: "Kadane's algorithm — maximum subarray sum.", tags: ["critical", "lc", "LC #53"] },
            { id: "dsa-3-8", text: "Dutch National Flag: sort 0s, 1s, 2s in O(N) one pass.", tags: ["critical", "lc", "LC #75"] },
            { id: "dsa-3-9", text: "Majority element (Moore's voting algorithm).", tags: ["lc", "LC #169"] },
            { id: "dsa-3-10", text: "Maximum product subarray. Best time to buy and sell stock.", tags: ["lc", "LC #121"] }
          ]
        },
        {
          title: "Unit 4 — Arrays Hard + 2D Matrix",
          items: [
            { id: "dsa-3-11", text: "3Sum (two pointers approach).", tags: ["hard", "lc", "LC #15"] },
            { id: "dsa-3-12", text: "Pascal's Triangle (generate rows).", tags: ["lc", "LC #118"] },
            { id: "dsa-3-13", text: "Set Matrix Zeroes (O(1) space solution).", tags: ["lc", "LC #73"] },
            { id: "dsa-3-14", text: "Spiral Matrix traversal.", tags: ["lc", "LC #54"] },
            { id: "dsa-3-15", text: "Rotate Image 90° in-place.", tags: ["lc", "LC #48"] },
            { id: "dsa-3-16", text: "REVISION DAY: 5 random array problems blind, timed 25 min each.", tags: [] }
          ]
        }
      ]
    },

    // ═══════════════════════════════════════
    // WEEK 4 DSA — June 14 – June 20
    // ═══════════════════════════════════════
    {
      week: 4,
      dates: "June 14 – June 20",
      units: [
        {
          title: "Unit 5 — Binary Search",
          items: [
            { id: "dsa-4-1", text: "Binary search template: implement iteratively AND recursively from memory", tags: [] },
            { id: "dsa-4-2", text: "First and last occurrence of element in sorted array.", tags: ["lc", "LC #34"] },
            { id: "dsa-4-3", text: "Count occurrences of element. Floor and ceil in sorted array.", tags: [] },
            { id: "dsa-4-4", text: "Search in rotated sorted array (no duplicates).", tags: ["lc", "LC #33"] },
            { id: "dsa-4-5", text: "Search in rotated sorted array (with duplicates).", tags: ["lc", "LC #81"] },
            { id: "dsa-4-6", text: "Find minimum in rotated sorted array.", tags: ["lc", "LC #153"] },
            { id: "dsa-4-7", text: "Single element in sorted array.", tags: ["lc", "LC #540"] },
            { id: "dsa-4-8", text: "Peak element (binary search on answers).", tags: ["lc", "LC #162"] },
            { id: "dsa-4-9", text: "Koko eating bananas (binary search on answer space).", tags: ["critical", "lc", "LC #875"] },
            { id: "dsa-4-10", text: "Minimum days to make M bouquets. Minimum capacity to ship packages.", tags: ["lc", "LC #1011"] },
            { id: "dsa-4-11", text: "Aggressive cows (classic). Book allocation problem.", tags: ["critical"] },
            { id: "dsa-4-12", text: "Search a 2D Matrix. Row with max 1s.", tags: ["lc", "LC #74"] },
            { id: "dsa-4-13", text: "REVISION: Redo 4 binary search problems blind. No solution hints.", tags: [] }
          ]
        }
      ]
    },

    // ═══════════════════════════════════════
    // WEEK 5 DSA — June 21 – June 27
    // ═══════════════════════════════════════
    {
      week: 5,
      dates: "June 21 – June 27",
      units: [
        {
          title: "Unit 6 — Strings",
          items: [
            { id: "dsa-5-1", text: "Reverse a string. Check palindrome. Valid anagram.", tags: ["lc", "LC #242"] },
            { id: "dsa-5-2", text: "Reverse words in a string. Longest common prefix.", tags: ["lc", "LC #151"] },
            { id: "dsa-5-3", text: "String to integer (atoi) — handle edge cases: leading spaces, sign, overflow.", tags: ["lc", "LC #8"] },
            { id: "dsa-5-4", text: "Longest palindromic substring (expand around center).", tags: ["critical", "lc", "LC #5"] },
            { id: "dsa-5-5", text: "Roman to integer. Integer to Roman.", tags: ["lc", "LC #13"] },
            { id: "dsa-5-6", text: "Count and say. Implement strStr (KMP algorithm concept).", tags: ["lc", "LC #28"] }
          ]
        },
        {
          title: "Unit 7 — Linked Lists",
          items: [
            { id: "dsa-5-7", text: "Implement singly linked list from scratch: Node struct, insert head/tail/pos, delete", tags: [] },
            { id: "dsa-5-8", text: "Reverse a linked list (iterative + recursive).", tags: ["critical", "lc", "LC #206"] },
            { id: "dsa-5-9", text: "Middle of linked list (slow/fast pointer).", tags: ["lc", "LC #876"] },
            { id: "dsa-5-10", text: "Merge two sorted linked lists.", tags: ["lc", "LC #21"] },
            { id: "dsa-5-11", text: "Detect cycle (Floyd's tortoise & hare). Find start of cycle.", tags: ["critical", "lc", "LC #142"] },
            { id: "dsa-5-12", text: "Palindrome linked list. Remove Nth node from end.", tags: ["lc", "LC #234"] },
            { id: "dsa-5-13", text: "Implement doubly linked list. Reverse doubly linked list.", tags: [] },
            { id: "dsa-5-14", text: "Reverse linked list in K-groups.", tags: ["hard", "lc", "LC #25"] },
            { id: "dsa-5-15", text: "REVISION: 3 string + 3 linked list problems blind. Timed.", tags: [] }
          ]
        }
      ]
    },

    // ═══════════════════════════════════════
    // WEEK 6 DSA — June 28 – July 5
    // ═══════════════════════════════════════
    {
      week: 6,
      dates: "June 28 – July 5",
      units: [
        {
          title: "Unit 8 — Stacks & Queues",
          items: [
            { id: "dsa-6-1", text: "Implement stack using array. Implement stack using linked list.", tags: [] },
            { id: "dsa-6-2", text: "Implement queue using array. Circular queue.", tags: [] },
            { id: "dsa-6-3", text: "Implement stack using 2 queues. Queue using 2 stacks.", tags: [] },
            { id: "dsa-6-4", text: "Valid parentheses (classic stack problem).", tags: ["lc", "LC #20"] },
            { id: "dsa-6-5", text: "Infix to postfix conversion. Evaluate postfix expression.", tags: [] },
            { id: "dsa-6-6", text: "Next Greater Element (monotonic stack).", tags: ["critical", "lc", "LC #496"] },
            { id: "dsa-6-7", text: "Previous smaller element. Next smaller element. (Monotonic stack variants)", tags: [] },
            { id: "dsa-6-8", text: "Trapping rain water (monotonic stack O(N) solution).", tags: ["critical", "lc", "LC #42"] },
            { id: "dsa-6-9", text: "Largest rectangle in histogram.", tags: ["hard", "lc", "LC #84"] },
            { id: "dsa-6-10", text: "Sliding window maximum using deque.", tags: ["critical", "lc", "LC #239"] },
            { id: "dsa-6-11", text: "Min stack (get minimum in O(1)).", tags: ["lc", "LC #155"] },
            { id: "dsa-6-12", text: "FINAL REVISION: Pick 5 hardest problems from all 8 units. Solve without help.", tags: [] }
          ]
        }
      ]
    }
  ],

  ml: [
    // ═══════════════════════════════════════
    // WEEK 1 ML — May 24 – May 30 · Course 1 Week 1
    // ═══════════════════════════════════════
    {
      week: 1,
      dates: "May 24 – May 30 · Course 1 Week 1",
      units: [
        {
          title: "Supervised Learning Intro",
          items: [
            { id: "ml-1-1", text: "Video: What is machine learning? Supervised vs unsupervised overview", tags: [] },
            { id: "ml-1-2", text: "Video: Supervised learning — regression and classification examples", tags: [] },
            { id: "ml-1-3", text: "Video: Linear regression model — hypothesis f(x) = wx + b", tags: [] },
            { id: "ml-1-4", text: "Video: Cost function J(w,b) — what it means to minimize it", tags: ["key", "key concept"] },
            { id: "ml-1-5", text: "Video: Visualizing cost function as a bowl/contour plot", tags: [] },
            { id: "ml-1-6", text: "Video: Gradient descent — the algorithm, learning rate alpha", tags: ["key", "key concept"] },
            { id: "ml-1-7", text: "Video: Gradient descent for linear regression — combined", tags: [] },
            { id: "ml-1-8", text: "Video: Running gradient descent — \"batch\" gradient descent", tags: [] },
            { id: "ml-1-9", text: "✅ Complete Week 1 Practice Quiz", tags: [] }
          ]
        }
      ]
    },

    // ═══════════════════════════════════════
    // WEEK 2 ML — May 31 – June 6 · Course 1 Week 2
    // ═══════════════════════════════════════
    {
      week: 2,
      dates: "May 31 – June 6 · Course 1 Week 2",
      units: [
        {
          title: "Multiple Linear Regression",
          items: [
            { id: "ml-2-1", text: "Video: Multiple features — f(x) = w·x + b (dot product form)", tags: [] },
            { id: "ml-2-2", text: "Video: Vectorization using NumPy — why it's faster than loops", tags: [] },
            { id: "ml-2-3", text: "Video: Gradient descent for multiple regression", tags: [] },
            { id: "ml-2-4", text: "Video: Feature scaling — mean normalization, Z-score normalization", tags: ["key", "key concept"] },
            { id: "ml-2-5", text: "Video: Checking gradient descent convergence (learning curve)", tags: [] },
            { id: "ml-2-6", text: "Video: Choosing the learning rate alpha", tags: [] },
            { id: "ml-2-7", text: "Video: Feature engineering and polynomial regression", tags: [] },
            { id: "ml-2-8", text: "✅ Programming Lab: Implement linear regression with NumPy (do not skip)", tags: [] },
            { id: "ml-2-9", text: "✅ Complete Week 2 Practice Quiz", tags: [] }
          ]
        }
      ]
    },

    // ═══════════════════════════════════════
    // WEEK 3 ML — June 7 – June 13 · Course 1 Week 3
    // ═══════════════════════════════════════
    {
      week: 3,
      dates: "June 7 – June 13 · Course 1 Week 3",
      units: [
        {
          title: "Classification & Logistic Regression",
          items: [
            { id: "ml-3-1", text: "Video: Classification vs regression — why linear regression fails for classification", tags: [] },
            { id: "ml-3-2", text: "Video: Logistic regression — sigmoid function σ(z)", tags: ["key", "key concept"] },
            { id: "ml-3-3", text: "Video: Decision boundary — linear and non-linear", tags: [] },
            { id: "ml-3-4", text: "Video: Cost function for logistic regression (log loss)", tags: [] },
            { id: "ml-3-5", text: "Video: Simplified cost function and gradient descent for logistic regression", tags: [] },
            { id: "ml-3-6", text: "Video: Overfitting problem — underfit / overfit / just right", tags: ["key", "key concept"] },
            { id: "ml-3-7", text: "Video: Addressing overfitting — more data, fewer features, regularization", tags: [] },
            { id: "ml-3-8", text: "Video: Regularization — cost function with lambda, intuition", tags: [] },
            { id: "ml-3-9", text: "Video: Regularized linear regression gradient descent", tags: [] },
            { id: "ml-3-10", text: "Video: Regularized logistic regression gradient descent", tags: [] },
            { id: "ml-3-11", text: "✅ Programming Lab: Logistic regression from scratch", tags: [] },
            { id: "ml-3-12", text: "✅ Course 1 Week 3 Quiz + Final Graded Assessment", tags: [] },
            { id: "ml-3-13", text: "🎉 COURSE 1 COMPLETE — Reflect: what does YOLO's loss function do now that you know log loss?", tags: [] }
          ]
        }
      ]
    },

    // ═══════════════════════════════════════
    // WEEK 4 ML — June 14 – June 20 · Course 2 Week 1
    // ═══════════════════════════════════════
    {
      week: 4,
      dates: "June 14 – June 20 · Course 2 Week 1",
      units: [
        {
          title: "Neural Networks",
          items: [
            { id: "ml-4-1", text: "Video: Neural networks intuition — neurons, layers, why they work", tags: [] },
            { id: "ml-4-2", text: "Video: Neural network model — layers, units, activations", tags: ["key", "key concept"] },
            { id: "ml-4-3", text: "Video: Forward propagation — matrix multiplication through layers", tags: [] },
            { id: "ml-4-4", text: "Video: TensorFlow implementation of a neural network", tags: [] },
            { id: "ml-4-5", text: "Video: Data in TensorFlow — tensors vs NumPy arrays", tags: [] },
            { id: "ml-4-6", text: "Video: Building a neural network in TensorFlow (Sequential model)", tags: [] },
            { id: "ml-4-7", text: "Video: Forward prop in NumPy — implement manually without TensorFlow", tags: [] },
            { id: "ml-4-8", text: "Video: Activation functions — sigmoid, ReLU, linear. When to use which.", tags: ["key", "key concept"] },
            { id: "ml-4-9", text: "Video: Why do we need activation functions at all? (without them = linear model)", tags: [] },
            { id: "ml-4-10", text: "Video: Multiclass classification — softmax regression", tags: ["key", "key concept"] },
            { id: "ml-4-11", text: "Video: Softmax implementation in TensorFlow", tags: [] },
            { id: "ml-4-12", text: "Video: Multi-label classification", tags: [] },
            { id: "ml-4-13", text: "✅ Programming Lab: Neural network for handwritten digit recognition", tags: [] },
            { id: "ml-4-14", text: "✅ Course 2 Week 1 Quiz", tags: [] }
          ]
        }
      ]
    },

    // ═══════════════════════════════════════
    // WEEK 5 ML — June 21 – June 27 · Course 2 Week 2
    // ═══════════════════════════════════════
    {
      week: 5,
      dates: "June 21 – June 27 · Course 2 Week 2",
      units: [
        {
          title: "Training Neural Networks",
          items: [
            { id: "ml-5-1", text: "Video: TensorFlow model training — compile, fit, evaluate", tags: [] },
            { id: "ml-5-2", text: "Video: Back-propagation intuition — chain rule, computing gradients", tags: ["key", "key concept"] },
            { id: "ml-5-3", text: "Video: Diagnosing bias and variance — learning curves", tags: ["key", "key concept"] },
            { id: "ml-5-4", text: "Video: Bias-variance tradeoff — high bias = underfit, high variance = overfit", tags: [] },
            { id: "ml-5-5", text: "Video: Regularization and bias/variance (L2 regularization)", tags: [] },
            { id: "ml-5-6", text: "Video: Establishing a baseline performance level", tags: [] },
            { id: "ml-5-7", text: "Video: Learning curves to diagnose bias/variance", tags: [] },
            { id: "ml-5-8", text: "Video: Deciding what to try next — a practical decision framework", tags: [] },
            { id: "ml-5-9", text: "Video: Error analysis — manually inspecting mistakes your model makes", tags: [] },
            { id: "ml-5-10", text: "Video: Adding data — data augmentation, transfer learning intro", tags: [] },
            { id: "ml-5-11", text: "Video: Transfer learning — using pretrained models", tags: ["key", "key concept"] },
            { id: "ml-5-12", text: "Video: Full cycle of a machine learning project", tags: [] },
            { id: "ml-5-13", text: "✅ Programming Lab: Neural network training and evaluation", tags: [] },
            { id: "ml-5-14", text: "✅ Course 2 Week 2 Quiz", tags: [] }
          ]
        }
      ]
    },

    // ═══════════════════════════════════════
    // WEEK 6 ML — June 28 – July 5 · Course 2 Week 3
    // ═══════════════════════════════════════
    {
      week: 6,
      dates: "June 28 – July 5 · Course 2 Week 3",
      units: [
        {
          title: "Decision Trees & Ensemble Methods",
          items: [
            { id: "ml-6-1", text: "Video: Decision tree model — structure, how predictions are made", tags: [] },
            { id: "ml-6-2", text: "Video: Learning a decision tree — how splits are chosen", tags: [] },
            { id: "ml-6-3", text: "Video: Measuring purity — entropy and information gain", tags: ["key", "key concept"] },
            { id: "ml-6-4", text: "Video: Decision tree splitting on continuous values", tags: [] },
            { id: "ml-6-5", text: "Video: Regression trees (predicting continuous values)", tags: [] },
            { id: "ml-6-6", text: "Video: Tree ensembles — why one tree isn't enough", tags: [] },
            { id: "ml-6-7", text: "Video: Sampling with replacement and random forests", tags: ["key", "key concept"] },
            { id: "ml-6-8", text: "Video: XGBoost — boosting intuition, why it's powerful", tags: ["key", "key concept"] },
            { id: "ml-6-9", text: "Video: When to use decision trees vs neural networks", tags: [] },
            { id: "ml-6-10", text: "✅ Programming Lab: Decision trees and XGBoost", tags: [] },
            { id: "ml-6-11", text: "✅ Course 2 Week 3 Quiz + Final Graded Assessment", tags: [] },
            { id: "ml-6-12", text: "🎉 COURSE 2 COMPLETE — You now understand what happens inside your YOLO models.", tags: [] }
          ]
        }
      ]
    }
  ]
};

const SCHEDULE_DATA = [
  // ═══════════════════════════════════════
  // WEEK 1
  // ═══════════════════════════════════════
  {
    week: 1,
    title: "C++ Zero to Functional",
    dates: "May 24 – May 30",
    phase: 1,
    tags: [
      { label: "DSA Unit 1–2", type: "dsa" },
      { label: "ML Week 1", type: "ml" }
    ],
    targets: {
      dsa: [
        "Syntax, data types, I/O",
        "Control flow, loops, functions",
        "Pass by value vs reference",
        "Pointers & memory basics",
        "Big O — time & space",
        "Start STL: vector, map, set"
      ],
      ml: [
        "Course 1 Week 1: Intro to ML",
        "What is supervised learning",
        "Linear regression intuition",
        "Cost function explained",
        "Complete all quizzes"
      ],
      os: [
        "Set up Antigravity properly",
        "Run the 3-min repo test on 5 repos",
        "Pick 1 beginner Python issue",
        "Goal: 1 PR submitted by Friday"
      ]
    },
    days: [
      { name: "Sat May 24", dsa: "Setup C++, syntax, data types, I/O cin/cout", ml: "Course 1 intro videos, what is ML, supervised vs unsupervised", os: "Setup Antigravity, read the guide, explore goodfirstissue.dev" },
      { name: "Sun May 25", dsa: "Control flow, loops, switch. Write 10 small programs", ml: "Linear regression: model representation, hypothesis", os: "Run 3-min test on 5 repos, shortlist 2 candidates" },
      { name: "Mon May 26", dsa: "Functions, pass by value vs reference (&). Practice both.", ml: "Cost function J(w,b) — understand what minimizing means", os: "Rest day. Use slot for ML catch-up or extra DSA" },
      { name: "Tue May 27", dsa: "Pointers, memory addresses, dereferencing. Big O notation.", ml: "Gradient descent — intuition, learning rate alpha", os: "Claim your first issue. Run briefing prompt on it." },
      { name: "Wed May 28", dsa: "STL: std::vector — push_back, size, iterate, sort", ml: "Gradient descent for linear regression, vectorization", os: "Implement the fix, run verification prompt, test suite" },
      { name: "Thu May 29", dsa: "STL: std::map, std::set, std::unordered_map basics", ml: "Week 1 graded quiz. Redo any videos that felt unclear.", os: "Rest day. Use slot for extra practice." },
      { name: "Fri May 30", dsa: "STL: stack, queue, priority_queue. std::sort + comparators", ml: "Multiple linear regression, feature scaling", os: "Submit PR #1. Write PR description using polish prompt." }
    ]
  },

  // ═══════════════════════════════════════
  // WEEK 2
  // ═══════════════════════════════════════
  {
    week: 2,
    title: "Recursion Mastery",
    dates: "May 31 – June 6",
    phase: 1,
    tags: [
      { label: "DSA Unit 3", type: "dsa" },
      { label: "ML Week 2", type: "ml" },
      { label: "PR #2", type: "os" }
    ],
    targets: {
      dsa: [
        "GCD (Euclidean Algorithm), LCM",
        "Sieve of Eratosthenes (primes)",
        "Recursion: call stack, base cases",
        "Draw recursion trees for every problem",
        "Fibonacci, factorial, power(x,n)",
        "Intro backtracking: subsets"
      ],
      ml: [
        "Polynomial regression",
        "Classification: logistic regression",
        "Sigmoid function, decision boundary",
        "Cost function for classification",
        "Complete Week 2 assignment"
      ],
      os: [
        "Respond to PR #1 feedback if any",
        "Find and claim PR #2 issue",
        "Target: Python or Next.js repo",
        "Submit PR #2 by end of week"
      ]
    },
    days: [
      { name: "Sat May 31", dsa: "Digit extraction, palindromes, GCD Euclidean algorithm", ml: "Polynomial regression, feature engineering", os: "Check PR #1 status. Search for issue #2." },
      { name: "Sun June 1", dsa: "Sieve of Eratosthenes. Practice prime problems on LeetCode.", ml: "Logistic regression: sigmoid, hypothesis, intuition", os: "Claim issue #2. Run briefing prompt." },
      { name: "Mon June 2", dsa: "Recursion intro. Draw call stacks on paper. Factorial, print 1-N.", ml: "Decision boundary, cost function for logistic regression", os: "Rest. Extra DSA or ML revision slot." },
      { name: "Tue June 3", dsa: "Fibonacci recursion. Understand stack overflow risk. Multiple calls.", ml: "Gradient descent for logistic regression, simplified cost", os: "Implement issue #2. Run test suite." },
      { name: "Wed June 4", dsa: "power(x,n), reverse array via recursion, check palindrome recursively", ml: "Overfitting, underfitting, regularization intro", os: "Submit PR #2. Polish the description." },
      { name: "Thu June 5", dsa: "Backtracking intro: generate all subsets of an array", ml: "Regularized linear & logistic regression. Week 2 quiz.", os: "Rest. Revision slot." },
      { name: "Fri June 6", dsa: "Recursion revision: redo all problems blind, no notes", ml: "Course 1 Week 3 start: neural network motivation", os: "Handle PR feedback if maintainer replied. Otherwise rest." }
    ]
  },

  // ═══════════════════════════════════════
  // WEEK 3
  // ═══════════════════════════════════════
  {
    week: 3,
    title: "Arrays Deep Dive",
    dates: "June 7 – June 13",
    phase: 1,
    tags: [
      { label: "DSA Unit 4", type: "dsa" },
      { label: "ML Course 1 End", type: "ml" },
      { label: "PR #3", type: "os" }
    ],
    targets: {
      dsa: [
        "Arrays easy: hashing, largest element, duplicates",
        "Rotating arrays, two pointers pattern",
        "Kadane's algo (max subarray sum)",
        "Dutch national flag (sort 0,1,2)",
        "Majority element (Moore's voting)",
        "Start 2D matrix problems"
      ],
      ml: [
        "Finish Course 1 completely",
        "Neural network basics (optional Week 3)",
        "Decision trees intro (Course 2 preview)",
        "Take Course 1 final quiz",
        "Start Course 2 Week 1"
      ],
      os: [
        "3rd PR this week",
        "Try an OpenCV or FastAPI repo now",
        "Goal: understand every line of your PR",
        "Start explaining fixes in plain English"
      ]
    },
    days: [
      { name: "Sat June 7", dsa: "Array hashing, largest element, remove duplicates from sorted array", ml: "Neural network motivation, why not just logistic regression", os: "Find issue #3 in an OpenCV or FastAPI repo" },
      { name: "Sun June 8", dsa: "Rotate array left/right. Two pointers: pair sum, container with water.", ml: "Neural network: layers, activations, forward propagation", os: "Briefing prompt for issue #3. Understand the codebase." },
      { name: "Mon June 9", dsa: "Kadane's algorithm. Maximum product subarray.", ml: "TensorFlow basics in Course 1 assignment. Do not skip.", os: "Rest. Revision slot." },
      { name: "Tue June 10", dsa: "Dutch national flag (3-pointer). Majority element Moore's voting algo.", ml: "Course 1 final assessment. Redo weak areas.", os: "Implement fix for issue #3. Test suite." },
      { name: "Wed June 11", dsa: "2D Matrix: set matrix zeroes, spiral traversal", ml: "Course 2 Week 1 start: neural networks in depth, weights & biases", os: "Submit PR #3. Write clean description." },
      { name: "Thu June 12", dsa: "Rotate matrix 90°. Hard: Pascal's triangle.", ml: "Activation functions: sigmoid, ReLU, why they matter", os: "Rest. Buffer for any PR feedback." },
      { name: "Fri June 13", dsa: "Weekly array revision: redo 5 problems blind. No looking at solutions.", ml: "Multiclass classification, softmax. Week 1 quiz Course 2.", os: "Review and respond to any open PR comments." }
    ]
  },

  // ═══════════════════════════════════════
  // WEEK 4
  // ═══════════════════════════════════════
  {
    week: 4,
    title: "Binary Search",
    dates: "June 14 – June 20",
    phase: 2,
    tags: [
      { label: "DSA Unit 5", type: "dsa" },
      { label: "ML Course 2", type: "ml" },
      { label: "PR #4–5", type: "os" }
    ],
    targets: {
      dsa: [
        "Binary search on 1D sorted arrays",
        "First and last occurrence",
        "Search in rotated sorted array",
        "Binary search on answers (key pattern)",
        "Aggressive cows, book allocation",
        "Koko eating bananas"
      ],
      ml: [
        "Course 2: back-propagation intuition",
        "Train/dev/test splits",
        "Bias vs variance tradeoff",
        "Regularization in NNs (L2, dropout)",
        "Course 2 Week 2 assignment"
      ],
      os: [
        "Target 2 PRs this week",
        "Pick slightly harder issues now",
        "You should be faster at this by now",
        "Can you explain each PR without AI?"
      ]
    },
    days: [
      { name: "Sat June 14", dsa: "Binary search template. Implement from scratch. First/last occurrence.", ml: "Back-propagation: intuition, chain rule, don't fear the math", os: "Find issue #4. Briefing prompt." },
      { name: "Sun June 15", dsa: "Rotated sorted array search. Count occurrences of element.", ml: "Train/dev/test splits, why we need a held-out set", os: "Implement PR #4." },
      { name: "Mon June 16", dsa: "Binary search on answers: Koko bananas, minimum days to make bouquets", ml: "Bias vs variance, diagnosing high bias / high variance", os: "Rest. Revision slot." },
      { name: "Tue June 17", dsa: "Aggressive cows, book allocation — classic binary search on answers", ml: "Regularization in NNs: L2, dropout. When to use what.", os: "Submit PR #4. Find and claim issue #5." },
      { name: "Wed June 18", dsa: "2D matrix binary search. Median of row-wise sorted matrix.", ml: "Course 2 Week 2 assignment — do it fully, debug your own errors", os: "Implement PR #5. Run tests." },
      { name: "Thu June 19", dsa: "Revision: redo 4 binary search problems blind", ml: "Optimization: mini-batch gradient descent, momentum", os: "Rest / PR feedback handling" },
      { name: "Fri June 20", dsa: "LeetCode session: 3 binary search problems, timed (30 min each max)", ml: "Adam optimizer, learning rate decay. Week 2 quiz.", os: "Submit PR #5." }
    ]
  },

  // ═══════════════════════════════════════
  // WEEK 5
  // ═══════════════════════════════════════
  {
    week: 5,
    title: "Strings + Linked Lists",
    dates: "June 21 – June 27",
    phase: 2,
    tags: [
      { label: "DSA Unit 6–7", type: "dsa" },
      { label: "ML Course 2", type: "ml" },
      { label: "PR #6", type: "os" }
    ],
    targets: {
      dsa: [
        "String: reverse, anagram, palindrome",
        "Longest common prefix, atoi",
        "Linked list: insert, delete, reverse",
        "Doubly linked list basics",
        "Floyd's cycle detection",
        "Middle of linked list"
      ],
      ml: [
        "Decision trees: how splits work",
        "Information gain, entropy",
        "Random forests intuition",
        "XGBoost overview",
        "Course 2 Week 3 assignment"
      ],
      os: [
        "1 PR this week (lighter week)",
        "Focus on quality over quantity",
        "Try to review someone else's PR too",
        "This builds community reputation"
      ]
    },
    days: [
      { name: "Sat June 21", dsa: "String basics: reverse words, anagram check, valid palindrome", ml: "Decision trees: entropy, information gain, how splits are chosen", os: "Find and claim issue #6" },
      { name: "Sun June 22", dsa: "Longest palindromic substring. String to integer (atoi) with edge cases.", ml: "Random forests: bagging, why it reduces overfitting", os: "Implement PR #6. Briefing + implementation prompts." },
      { name: "Mon June 23", dsa: "Linked list: implement from scratch, insert at head/tail/middle, delete", ml: "XGBoost: boosting intuition, why it often beats random forests", os: "Rest. Revision." },
      { name: "Tue June 24", dsa: "Reverse linked list. Middle of list. Merge two sorted lists.", ml: "When to use decision trees vs NNs. Tabular vs image/text data.", os: "Submit PR #6. Review someone else's open PR in same repo." },
      { name: "Wed June 25", dsa: "Floyd's tortoise & hare: detect cycle, find start of cycle", ml: "Course 2 Week 3 assignment. Full practice lab.", os: "Handle any PR feedback" },
      { name: "Thu June 26", dsa: "Doubly linked list. Palindrome linked list check.", ml: "Course 2 final quiz + review. Start thinking about what Course 3 covers.", os: "Rest" },
      { name: "Fri June 27", dsa: "Revision: strings + linked list. 4 problems blind, timed.", ml: "Course 2 complete ✓. Rest of day: reflect on what you now understand vs before.", os: "Look ahead: pick a repo you want to contribute to long-term" }
    ]
  },

  // ═══════════════════════════════════════
  // WEEK 6
  // ═══════════════════════════════════════
  {
    week: 6,
    title: "Stacks, Queues + Buffer",
    dates: "June 28 – July 5",
    phase: 2,
    tags: [
      { label: "DSA Unit 8", type: "dsa" },
      { label: "ML Wrap Up", type: "ml" },
      { label: "PR #7", type: "os" }
    ],
    targets: {
      dsa: [
        "Stack using arrays + linked list",
        "Queue using arrays + linked list",
        "Infix to postfix conversion",
        "Monotonic stack: next greater element",
        "Trapping rain water (O(N) solution)",
        "Sliding window max using deque"
      ],
      ml: [
        "Consolidate Courses 1 & 2",
        "Re-do any failed assignments",
        "Revisit: what is YOLO actually doing now?",
        "Optional: start Course 3 Week 1",
        "Write a 1-page ML concept summary"
      ],
      os: [
        "Final PR of the summer",
        "Aim for something slightly complex",
        "Write a LinkedIn post about your summer",
        "Count: 7 PRs, 2 ML courses, Units 1–8 DSA"
      ]
    },
    days: [
      { name: "Sat June 28", dsa: "Stack from scratch: array + LL implementations. Valid parentheses.", ml: "Consolidation: redo any Course 1 concept that still feels fuzzy", os: "Find final issue #7. Briefing prompt." },
      { name: "Sun June 29", dsa: "Queue from scratch. Circular queue. Deque implementation.", ml: "Look back at your YOLO/YOLOv8s work: what do you understand now that you didn't before?", os: "Implement PR #7." },
      { name: "Mon June 30", dsa: "Infix to postfix. Evaluate postfix expression.", ml: "Write a 1-page concept map: gradient descent → logistic → NN → trees", os: "Submit PR #7." },
      { name: "Tue July 1", dsa: "Monotonic stack: next greater element, previous smaller element", ml: "Optional Course 3 Week 1: K-means clustering. Lightweight, no pressure.", os: "Rest. Handle PR feedback." },
      { name: "Wed July 2", dsa: "Trapping rain water: brute → prefix max → O(N) two pointers", ml: "Revision / rest day for ML", os: "Draft LinkedIn post about your open source summer" },
      { name: "Thu July 3", dsa: "Largest rectangle in histogram. Sliding window maximum (deque).", ml: "Free. Watch a 3Blue1Brown neural network video for fun.", os: "Rest" },
      { name: "Fri July 4", dsa: "Final revision: pick hardest problems from Units 1–8. Test yourself.", ml: "Done ✓. Courses 1 & 2 complete. Celebrate that.", os: "Post on LinkedIn. Summer wrap. 7 PRs merged." },
      { name: "Sat July 5", dsa: "Break day ✓", ml: "Break day ✓", os: "Break day ✓" }
    ]
  }
];
