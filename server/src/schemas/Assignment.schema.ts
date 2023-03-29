import client from '../config/databaseConfig'

const AssignmentSchema = new client.Schema({
  title: { type: String, required: true },
  questions: [
    {
      prompt: { type: String, required: true },
      answer: { type: String, required: true },
    },
  ],
  mostRecentAttempt: { type: Date, default: null },
  totalAttempts: { type: Number, default: 0 },
  pinned: { type: Boolean, default: false },
  owner: { type: client.Types.ObjectId, ref: 'User', required: true },
})

const MAssignment = client.model('Assignment', AssignmentSchema)

export default MAssignment
