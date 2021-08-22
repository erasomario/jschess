const { getCollection } = require("../../utils/Mongo")
const getSequences = () => getCollection("sequences")

const getNext = async name => {
    return (await getSequences().findOneAndUpdate(
        { name },
        { $inc: { current: 1 } },
        { returnDocument: "after", upsert: true }
    )).value.current
}

module.exports = {
    getNext
}