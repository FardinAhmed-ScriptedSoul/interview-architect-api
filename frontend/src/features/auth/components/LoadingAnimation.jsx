import React from 'react'
import '../.././../style/LoadingAnimation.scss'

const LoadingAnimation = () => (
    <div className='loading-overlay'>
        <div className='loading-overlay__logo'>
            Interview<span>.</span>AI
        </div>
        <div className='loading-overlay__spinner' />
        <p className='loading-overlay__text'>Initializing session</p>
        <div className='loading-overlay__bar'>
            <div className='loading-overlay__bar-fill' />
        </div>
    </div>
)

export default LoadingAnimation