const makeGetNextInteractor = repo => {

    const getNext = name => {
        return repo.getNext(name)
    }

    return {
        getNext
    }

}

module.exports = makeGetNextInteractor


