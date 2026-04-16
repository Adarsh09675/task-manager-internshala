const { z } = require('zod');
const res = z.string().url().safeParse("mongodb+srv://cluster0.abcde.mongodb.net");
console.log(res.success ? "Passes" : "Fails");
