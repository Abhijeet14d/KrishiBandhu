@Library('Shared') _

pipeline {
    agent any
    
    environment {
        // Backend & Frontend Images
        BACKEND_IMAGE = 'adarsh5559/krishbandhu-backend'
        FRONTEND_IMAGE = 'adarsh5559/krishbandhu-frontend'

        IMAGE_TAG = "${BUILD_NUMBER}"

        GIT_REPO = "https://github.com/Adarsh097/KrishiBandhu.git"
        GIT_BRANCH = "main"
    }
    
    stages {

        stage('Cleanup Workspace') {
            steps {
                script {
                    clean_ws()
                }
            }
        }
        
        stage('Clone Repository') {
            steps {
                script {
                    clone(env.GIT_REPO, env.GIT_BRANCH)
                }
            }
        }

        //  Build Images (Parallel)
        stage('Build Docker Images') {
            parallel {

                stage('Build Backend Image') {
                    steps {
                        script {
                            docker_build(
                                imageName: env.BACKEND_IMAGE,
                                imageTag: env.IMAGE_TAG,
                                dockerfile: 'backend/Dockerfile',
                                context: './backend'
                            )
                        }
                    }
                }

                stage('Build Frontend Image') {
                    steps {
                        script {
                            docker_build(
                                imageName: env.FRONTEND_IMAGE,
                                imageTag: env.IMAGE_TAG,
                                dockerfile: 'frontend/Dockerfile',
                                context: './frontend'
                            )
                        }
                    }
                }
            }
        }

        //  Run Unit Tests  
        stage('Run Unit Tests') {
            steps {
                script {
                    run_tests()
                }
            }
        }

        //  Security Scan
        stage('Security Scan with Trivy') {
            steps {
                script {
                    trivy_scan()
                }
            }
        }

        //  Push Images
        stage('Push Docker Images') {
            parallel {

                stage('Push Backend Image') {
                    steps {
                        script {
                            docker_push(
                                imageName: env.BACKEND_IMAGE,
                                imageTag: env.IMAGE_TAG,
                                credentials: 'docker-hub-credentials'
                            )
                        }
                    }
                }

                stage('Push Frontend Image') {
                    steps {
                        script {
                            docker_push(
                                imageName: env.FRONTEND_IMAGE,
                                imageTag: env.IMAGE_TAG,
                                credentials: 'docker-hub-credentials'
                            )
                        }
                    }
                }
            }
        }

        //  GitOps Update - Update Kubernetes Manifests
        stage('Update Kubernetes Manifests') {
            steps {
                script {
                    update_k8s_manifests(
                        imageTag: env.IMAGE_TAG,
                        manifestsPath: 'kubernetes',
                        gitCredentials: 'github-credentials',
                        gitUserName: 'Adarsh097',
                        gitUserEmail: 'adarshgupta0601@gmail.com'
                    )
                }
            }
        }
    }
}