package com.samsung.android.health.sdk.sample.healthdiary.viewmodel

import android.app.Activity
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.samsung.android.health.sdk.sample.healthdiary.utils.AppConstants
import com.samsung.android.health.sdk.sample.healthdiary.utils.getExceptionHandler
import com.samsung.android.sdk.health.data.HealthDataStore
import com.samsung.android.sdk.health.data.data.HealthDataPoint
import com.samsung.android.sdk.health.data.request.DataTypes
import kotlinx.coroutines.launch

class ChooseFoodViewModel(private val healthDataStore: HealthDataStore, activity: Activity) :
    ViewModel() {

    private val _nutritionInsertResponse = MutableLiveData<Boolean>()
    private val _exceptionResponse: MutableLiveData<String> = MutableLiveData<String>()
    private val exceptionHandler = getExceptionHandler(activity, _exceptionResponse)
    val exceptionResponse: LiveData<String> = _exceptionResponse
    val nutritionInsertResponse: LiveData<Boolean> = _nutritionInsertResponse

    fun insertNutritionData(nutritionData: HealthDataPoint) {
        val insertRequest = DataTypes.NUTRITION.insertDataRequestBuilder
            .addData(nutritionData)
            .build()

        /**  Make SDK call to insert nutrition data */
        viewModelScope.launch(AppConstants.SCOPE_IO_DISPATCHERS + exceptionHandler) {
            healthDataStore.insertData(insertRequest)
            _nutritionInsertResponse.postValue(true)
        }
    }
}
