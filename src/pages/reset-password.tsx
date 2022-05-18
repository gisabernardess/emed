import {
  Button,
  Flex,
  Heading,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { NextPage } from 'next'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import { Input } from '../components/form/input'
import { useAuth } from '../services/contexts/AuthContext'
import { emailValidator } from '../utils/validators'

interface IResetPasswordInputs {
  email: string
}

const ResetPassword: NextPage = () => {
  const { resetPassword } = useAuth()

  const methods = useForm<IResetPasswordInputs>({
    mode: 'onChange',
  })

  const onSubmitHandler: SubmitHandler<IResetPasswordInputs> = async (
    form: IResetPasswordInputs,
  ) => {
    await resetPassword(form)
  }

  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      <FormProvider {...methods}>
        <Stack
          as="form"
          spacing={4}
          w={'full'}
          maxW={'md'}
          bg={useColorModeValue('white', 'gray.700')}
          rounded={'xl'}
          boxShadow={'lg'}
          p={6}
          my={12}
          onSubmit={methods.handleSubmit(form => {
            if (methods.formState.isValid) {
              onSubmitHandler(form)
            }
          })}
        >
          <Heading lineHeight={1.1} fontSize={{ base: '2xl', md: '3xl' }}>
            Forgot your password?
          </Heading>
          <Text
            fontSize={{ base: 'sm', sm: 'md' }}
            color={useColorModeValue('gray.800', 'gray.400')}
          >
            You&apos;ll get an email with a new password
          </Text>
          <Input
            name="email"
            type="email"
            placeholder="your-email@example.com"
            validators={emailValidator}
          />
          <Stack spacing={6}>
            <Button
              type="submit"
              colorScheme="blue"
              disabled={!methods.formState.isValid}
              isLoading={methods.formState.isSubmitting}
            >
              Request Reset
            </Button>
          </Stack>
        </Stack>
      </FormProvider>
    </Flex>
  )
}

export default ResetPassword