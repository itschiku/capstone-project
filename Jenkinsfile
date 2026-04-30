pipeline {
    agent any
    
    environment {
        AWS_REGION = 'ap-south-1'
        ECR_ACCOUNT = '475790160954'
        BACKEND_EC2_ID = 'i-0aba37cc978373707'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/itschiku/capstone-project.git'
            }
        }
        
        stage('Login to ECR') {
            steps {
                script {
                    sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com"
                }
            }
        }
        
        stage('Build FastAPI') {
            steps {
                script {
                    dir('backend/fastapi') {
                        sh "docker build -t ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-fastapi:latest ."
                        sh "docker tag ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-fastapi:latest ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-fastapi:build-${BUILD_NUMBER}"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-fastapi:latest"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-fastapi:build-${BUILD_NUMBER}"
                    }
                }
            }
        }
        
        stage('Build Node.js') {
            steps {
                script {
                    dir('backend/nodejs') {
                        sh "docker build -t ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-nodejs:latest ."
                        sh "docker tag ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-nodejs:latest ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-nodejs:build-${BUILD_NUMBER}"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-nodejs:latest"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-nodejs:build-${BUILD_NUMBER}"
                    }
                }
            }
        }
        
        stage('Build Spring Boot') {
            steps {
                script {
                    dir('backend/springboot') {
                        sh "docker build -t ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-springboot:latest ."
                        sh "docker tag ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-springboot:latest ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-springboot:build-${BUILD_NUMBER}"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-springboot:latest"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-springboot:build-${BUILD_NUMBER}"
                    }
                }
            }
        }
        
        stage('Build .NET') {
            steps {
                script {
                    dir('backend/dotnet') {
                        sh "docker build -t ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-dotnet:latest ."
                        sh "docker tag ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-dotnet:latest ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-dotnet:build-${BUILD_NUMBER}"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-dotnet:latest"
                        sh "docker push ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/capstone-dotnet:build-${BUILD_NUMBER}"
                    }
                }
            }
        }
        
        stage('Deploy to Private EC2') {
            steps {
                script {
                    sh "aws ssm send-command --instance-ids ${BACKEND_EC2_ID} --region ${AWS_REGION} --document-name AWS-RunShellScript --parameters 'commands=[\"aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com\",\"cd /home/ssm-user/capstone-project\",\"git pull origin main\",\"cd backend\",\"docker-compose pull\",\"docker-compose up -d\",\"docker system prune -f\"]' --comment Deploy"
                }
            }
        }
        
        stage('Verify') {
            steps {
                script {
                    sh "aws ssm send-command --instance-ids ${BACKEND_EC2_ID} --region ${AWS_REGION} --document-name AWS-RunShellScript --parameters 'commands=[\"docker ps --format table {{.Names}}\\\\t{{.Status}}\"]'"
                }
            }
        }
    }
    
    post {
        success {
            echo 'Build and deployment successful!'
        }
        failure {
            echo 'Build or deployment failed!'
        }
    }
}
