import Api from '@/services/api'
import Cookies from 'js-cookie'
import { checkAndSetToken } from '@/utils/tools'

export default {
  state: {
    tags: [],
  },
  mutations: {
    SET_TAGS(state, tags) {
      state.tags = tags
    },
    ADD_TAG(state, tag) {
      let tags = state.tags.concat(tag)
      state.tags = tags
    },
    UPDATE_TAGS(state, video) {
      let videoId = video._id
      let videoTags = video.tagIds
      let tags = state.tags
      tags.forEach(tag => {
        if (videoTags.includes(tag._id)) {
          if (!tag.videosId.includes(videoId)) {
            tag.videosId.push(videoId)
            console.log(`ADD VIDEO TO TAG: ${tag.name}`)
          }
        } else {
          if (tag.videosId.includes(videoId)) {
            console.log(`REMOVE VIDEO FROM TAG: ${tag.name}`)
            tag.videosId = tag.videosId.filter(vid => vid != videoId)
          }
        }
      })
      state.tags = tags;
    },
    DELETE_TAG(state, tagId) {
      let tags = state.tags.filter(t => t._id != tagId)
      state.tags = tags
    },
    LOGOUT_TAGS(state) {
      state.tags = []
    }
  },
  actions: {
    async loadTags({ commit }) {
      console.log("Load tags")
      let response = await Api().get("/tags");
      let tags = response.data
      commit('SET_TAGS', tags)
    },
    async updateTags({ commit, state }, video) {
      console.log("Update tags")
      let videoId = video._id
      let videoTags = video.tagIds
      let tags = state.tags
      for (let tag of tags) {
        if (videoTags.includes(tag._id)) {
          if (!tag.videosId.includes(videoId)) {
            console.log(`ADD VIDEO TO TAG: ${tag.name}`)
            tag.videosId.push(videoId)
            let newTag = tag
            await Api().patch(`/tags/${newTag._id}`, newTag)
          }
        } else {
          if (tag.videosId.includes(videoId)) {
            console.log(`REMOVE VIDEO FROM TAG: ${tag.name}`)
            tag.videosId = tag.videosId.filter(vid => vid != videoId)
            let newTag = tag
            await Api().patch(`/tags/${newTag._id}`, newTag)

          }
        }
      }
      commit('SET_TAGS', tags)
    },
    async addTags({ commit }, tags) {
      let newTags = []
      for (let tag of tags) {
        try {
          let response = await Api().post('/tags', tag)
          let newTag = response.data
          console.log(`ADDED NEW TAG: ${newTag.name}`)
          commit('ADD_TAG', newTag)
          newTags = newTags.concat(newTag)
        } catch (error) {
          console.log(error)
        }
      }
      return newTags
    },
    async deleteTag({ commit, rootState }, tag) {
      let userToken = { accessToken: Cookies.get('UAT'), refreshToken: Cookies.get('URT') }
      let message = checkAndSetToken(userToken, Api, Cookies)

      message.then(async (result) => {
        if (result.name == 'OK') {
          let delTag = tag
          for (let video of rootState.videoModel.videos) {
            if (delTag.videosId.includes(video._id)) {
              video.tagIds = video.tagIds.filter(id => id != delTag._id)
              let updatedVideo = video

              await Api().patch(`/videos/${updatedVideo._id}`)

              console.log(`REMOVE TAG: ${delTag.name} FROM VIDEO: ${video.name}`)
            }
          }
          await Api().delete(`/tags/${delTag._id}`)

          commit('DELETE_TAG', delTag._id)
        }
      })
    }
  },
  getters: {
    getTag: state => _id => {
      return state.tags.find(t => t._id == _id);
    }
  },
}
