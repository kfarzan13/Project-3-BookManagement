const { isValidObjectId } = require('mongoose')
const bookModel = require('../models/bookModel')
const userModel = require('../models/userModel')
const reviewModel = require('../models/reviewModel.js')
const { isValidString } = require('../validations/validation')
const moment = require('moment')

const createReview = async function (req, res) {

    try {

    let bookId = req.params.bookId
    let data = req.body

    let { review , reviewedBy , rating , reviewedAt } = data

    if (!isValidString(review)) return res.status(400).send({ status : false , message : "Review is required !!!" })
    if (!isValidString(reviewedBy)) return res.status(400).send({ status : false , message : "Review date is required !!!" })
    if (!(rating <= 5 && rating >= 1)) return res.status(400).send({ status : false , message : "Please provide a valid rating between 1-5 !!!" })

    if (!bookId) return res.status(400).send({ status : false , message : "BookId is required !!!" })
    if (!isValidObjectId(bookId)) return res.status(400).send({ status : false , message : "BookId is not a valid ObjectId !!!" })

    let findBook = await bookModel.findById( bookId )
    if (!findBook) return res.status(404).send({ status : false , message : "Book not found !!!" })
    if (findBook.isDeleted == true) return res.status(404).send({ status : false , message : "This book has been deleted !!!" })

    data.bookId = bookId
    data.reviewedAt = moment(reviewedAt).format('YYYY-MM-DD')

    let reviewCreated = await reviewModel.create(data)

    if (reviewCreated) {
        let updatedBook = await bookModel.findOneAndUpdate({ _id : bookId },{ $inc : { reviews : 1, } },{ new : true }).select({ ISBN : 0 , __v : 0 }).lean()

        let reviewData = await reviewModel.find({ bookId , isDeleted : false }).select({ isDeleted : 0 , createdAt : 0 , updatedAt : 0 , __v : 0 })

        updatedBook.reviewsData = reviewData

        res.status(200).send({ status : true , message : "Book list" , data : updatedBook })
    }
    } catch (err) {
        res.status(500).send({ status : false , message : err.message })
    }
}

const updateReview = async function(req , res){

    try {
    
    let bookId = req.params.bookId
    let reviewId = req.params.reviewId
    let data = req.body
    let { review , rating , reviewedBy } = data

    if(Object.keys(data).length == 0) return res.status(400).send({ status : false, message : "Please enter valid keys for updation !!!" })

    if(!isValidObjectId(bookId)) return res.status(400).send({ status : false , message : "BookId is not a valid ObjectId !!!" })
    let bookData = await bookModel.findById(bookId).select({ ISBN : 0 , __v : 0 }).lean()
    if(!bookData) return res.status(404).send({ status : false , message : "This book is not present !!!" })
    if(bookData.isDeleted === true) return res.status(404).send({ status : false, message : "This book is already deleted !!!" })

    if(!isValidObjectId(reviewId)) return res.status(400).send({ status : false , message : "ReviewId is not a valid ObjectId !!!" })
    let reviewData = await reviewModel.findById(reviewId)
    if(!reviewData) return res.status(404).send({ status : false , message : "This review is not present !!!" })
    if(reviewData.isDeleted === true) return res.status(404).send({ status : false , message : "This review is already deleted !!!" })

    if(review){ 
        if(!isValidString(review)) return res.status(400).send({ status : false, message : "Please enter valid review !!!" })
    }

    if(rating){
        if (!isValidString(rating)) return res.status(400).send({ status : false , message : "Rating should have string datatype !!!" })
        if (!(rating <= 5 && rating >= 1)) return res.status(400).send({ status : false , message : "Please provide a valid rating between 1-5 !!!" })
    }

    if(reviewedBy){
        if (!isValidString(reviewedBy)) return res.status(400).send({ status : false , message : "Please enter valid reviewedBy and Should be in String !!!" })
    }

    let updateReviewData = await reviewModel.findOneAndUpdate({ _id : reviewId , isDeleted : false } , data , { new : true })

    if(!updateReviewData) return res.status(400).send({ status : true , message : "Review not updated!!!" })

    let newReviewData = await reviewModel.find({ bookId , isDeleted : false }).select({ isDeleted : 0 , createdAt : 0 , updatedAt : 0 , __v : 0 })

    bookData.reviewsData = newReviewData

    res.status(200).send({ status : true , message : "Book list" , data : bookData })

    } catch (err) {
        res.status(500).send({ status : false , message : err.message })
    }
}

const deleteReview = async function (req, res){

    try{

    const { bookId , reviewId } = req.params

    if (!isValidObjectId(bookId)) {return res.status(400).send({ status : false, message : "Invalid BookId !!!" })}
    let checkBook = await bookModel.findById(bookId).lean()
    if(!checkBook) return res.status(404).send({ status : false, message : "Book not found !!!" })
    if (checkBook.isDeleted === true) return res.status(404).send({ status : false , message : "Book is already deleted !!!" })

    if (!isValidObjectId(reviewId)) {return res.status(400).send({ status : false, message : "Invalid reviewId !!!" }) }
    let checkReview = await reviewModel.findById(reviewId)
    if(!checkReview) return res.status(404).send({ status : false, message : "Review not found !!!" })
    if (checkReview.isDeleted === true) return res.status(404).send({ status : false , message : "Review is already deleted !!!" })

    const deleteReviewDetails = await reviewModel.findOneAndUpdate( { _id : reviewId } , { isDeleted : true, deletedAt : new Date() } , { new : true })

    if (!deleteReviewDetails) return res.status(400).send({ status : false , message : "Review not deleted !!!" })

    let deletedBook = await bookModel.findOneAndUpdate({ _id : bookId } , { $inc : { reviews: -1 } } , { new : true } ).select({ ISBN : 0 , __v : 0 }).lean()

    let reviewData = await reviewModel.find({ bookId , isDeleted : false }).select({ isDeleted : 0 , createdAt : 0 , updatedAt : 0 , __v : 0 })

    deletedBook.reviewsData = reviewData

    res.status(200).send({ status : true , message : "Book list" , data : deletedBook })

    } catch(err){
        res.status(500).send({ status : false, message : err.message })
    }
}

module.exports = { createReview , updateReview , deleteReview }