import mongoose from "mongoose";

// Access the "mockTests" collection directly via the existing Mongoose connection
const getMockTest = async (req, res) => {
  try {
    const collection = mongoose.connection.collection("mockTests");

    const mockTest = await collection.findOne({ testId: req.params.testId });

    if (!mockTest) {
      return res.status(404).json({ message: "Mock test not found" });
    }

    res.json(mockTest);
  } catch (error) {
    console.error("getMockTest error:", error);
    res.status(500).json({ message: "Server error while fetching mock test" });
  }
};

export default getMockTest;
