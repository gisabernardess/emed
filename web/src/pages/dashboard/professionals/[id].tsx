import { Heading, HStack } from '@chakra-ui/react'
import { Country, State } from 'country-state-city'
import { GetServerSideProps } from 'next'
import { parseCookies } from 'nookies'
import React, { useRef } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { passwordStrengthValidator } from '@/utils/validators/passwordValidator'
import { Input } from '../../../components/form/input'
import { FormLayout } from '../../../components/form/layout/FormLayout'
import { Select } from '../../../components/form/select'
import { Professional } from '../../../models'
import { ProfessionalRole } from '../../../models/enums'
import { Specialty } from '../../../models/specialty.model'
import { api } from '../../../services/api'
import { getAPIClient } from '../../../services/axios'
import { useAuth } from '../../../services/contexts/AuthContext'
import { useNotification } from '../../../services/hooks/useNotification'
import { useRoles } from '../../../services/hooks/useRoles'
import { EMED_TOKEN } from '../../../utils'
import { emailValidator } from '../../../utils/validators'

export interface IProfessionalInputs {
  name: string
  registrationNumber?: number
  registrationState?: string
  specialty?: string
  email: string
  oldPassword?: string
  password?: string
  passwordConfirmation?: string

  country?: string
}

interface IUpdateProfessionalProps {
  professional: Professional
  specialties: Specialty[]
}

const UpdateProfessional: React.FC<IUpdateProfessionalProps> = ({
  professional,
  specialties,
}) => {
  const notification = useNotification()
  const { professional: currentProfessional } = useAuth()
  const { isAdmin } = useRoles()

  const isOwnProfile = professional.id === currentProfessional?.id

  const methods = useForm<IProfessionalInputs>({
    mode: 'onChange',
    defaultValues: { ...professional },
  })
  const password = useRef<{}>()
  password.current = methods.watch('password', '')

  const watchCountry = methods.watch('country') ?? ''
  const roleIsRequired =
    professional.role === ProfessionalRole.DOCTOR ||
    professional.role === ProfessionalRole.NURSE

  const handleUpdateProfessional: SubmitHandler<
    IProfessionalInputs
  > = async values => {
    try {
      await api
        .put(`/professionals/${professional.id}`, {
          id: professional.id,
          ...values,
        })
        .then(() => {
          notification.success({
            title: 'Professional updated successfully',
            to: '/dashboard/professionals',
          })
        })
        .catch(({ response }) => {
          notification.error({ message: response.data.error })
        })
    } catch (error) {
      notification.error()
    }
  }

  return (
    <FormLayout
      methods={methods}
      header={`Update ${isOwnProfile ? 'Profile' : 'Professional'}`}
      onSubmit={handleUpdateProfessional}
      returnTo="/dashboard/professionals"
    >
      <Select
        label="Role"
        name="role"
        disabled={isOwnProfile || !isAdmin}
        options={Object.keys(ProfessionalRole).map(key => {
          return {
            label: key.charAt(0) + key.slice(1).toLowerCase(),
            value: key,
          }
        })}
      />
      {professional.registrationNumber && (
        <>
          <Input
            name="registrationNumber"
            label="Registration Number"
            type="number"
            validators={{
              required: roleIsRequired && 'Registration number is required',
            }}
          />
          <HStack>
            <Select
              name="country"
              label="Country"
              options={Country.getAllCountries().map(({ name, isoCode }) => {
                return {
                  label: name,
                  value: isoCode,
                }
              })}
              validators={{
                required: roleIsRequired && 'Registration country is required',
              }}
            />
            <Select
              name="registrationState"
              label="State/Region/Province"
              options={State.getStatesOfCountry(watchCountry).map(
                ({ name, isoCode }) => {
                  return {
                    label: name,
                    value: isoCode,
                  }
                },
              )}
              validators={{
                required: roleIsRequired && 'Registration state is required',
              }}
            />
          </HStack>
        </>
      )}
      <Input
        name="name"
        label="Full name"
        placeholder="Jane Doe"
        validators={{ required: 'Name is required' }}
      />
      {professional.specialty && (
        <Select
          label="Specialty"
          name="specialty"
          options={specialties?.map(({ name }: Specialty) => {
            return {
              label: name,
              value: name,
            }
          })}
          validators={{
            required: roleIsRequired && 'Specialty is required',
          }}
        />
      )}
      <Input
        name="email"
        label="Email"
        type="email"
        placeholder="your-email@example.com"
        validators={emailValidator}
      />
      {isOwnProfile && (
        <>
          <Heading
            lineHeight={1.1}
            fontSize={{ base: '2xl', sm: '3xl' }}
            paddingTop={2}
          >
            Update Password
          </Heading>
          <Input
            name="oldPassword"
            label="Current Password"
            type="password"
            validators={{ required: 'Your current password is required' }}
          />
          <Input
            name="password"
            label="Password"
            type="password"
            validators={passwordStrengthValidator}
          />
          <Input
            name="passwordConfirmation"
            label="Password Confirmation"
            type="password"
            validators={{
              required: 'Confirm password is required',
              validate: value => {
                if (password.current) {
                  return (
                    password.current === value ||
                    'The password and confirmation do not match'
                  )
                }
                return false
              },
            }}
          />
        </>
      )}
    </FormLayout>
  )
}

export default UpdateProfessional

export const getServerSideProps: GetServerSideProps = async ctx => {
  const apiClient = getAPIClient(ctx)

  const { [EMED_TOKEN]: token } = parseCookies(ctx)

  if (!token) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  const { params } = ctx
  const professional = await apiClient.get(`/professionals/${params?.id}`)
  const specialties = await apiClient.get('/specialties')

  return {
    props: { professional: professional.data, specialties: specialties.data },
  }
}
